import type {
  Participant,
  Participation,
  QuizState,
  QuizResult,
  Submission,
  BoothResult,
} from '../types';
import { collectDeviceMetadata } from '../utils/deviceFingerprint';
import { generateParticipationKey } from '../utils/participation';
import { buildSubmission, validateSubmission } from '../utils/submission';
import { saveSubmissionRecord } from '../utils/storage';
import {
  pushRegistrationToResultRepo,
  pushTestResultToResultRepo,
} from './resultRepoService';

export async function generateSubmission(
  participant: Participant,
  quizState: QuizState,
  result: QuizResult,
  boothsCompletedSoFar: number = 1,
): Promise<Submission> {
  const device = collectDeviceMetadata();
  const participationKey = await generateParticipationKey(participant);
  const participation: Participation = {
    deviceId: device.deviceId,
    participationKey,
    attemptNumber: boothsCompletedSoFar,
  };

  const submission = buildSubmission(participant, device, participation, quizState, result, boothsCompletedSoFar);
  if (!validateSubmission(submission)) {
    throw new Error('Generated submission failed validation.');
  }
  return submission;
}

/**
 * Registers participant and syncs to:
 * 1. Google Sheets webhook (Excel)
 * 2. GitHub repository: https://github.com/krishnakumarsabbu-prog/TECH_SUMMIT_RESULT.git
 *    (creates results/{EntID}/registration.json and results/{EntID}/summary.json)
 * 3. Local server (http://localhost:3001/api/register) if active
 */
export async function registerParticipant(participant: Participant): Promise<void> {
  const regPayload = JSON.stringify({
    eventType: 'REGISTRATION',
    action: 'REGISTER_PARTICIPANT',
    participant,
    registeredAt: new Date().toISOString(),
  }, null, 2);

  // 1. Google Sheets Webhook or custom submission endpoint (Excel)
  const webhookUrl = localStorage.getItem('technology-summit-webhook-url') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUBMISSION_ENDPOINT) ||
    'https://script.google.com/macros/s/AKfycbwNSijCcsncqXoBKFBNqq8KrT45sD5BIl9onLwE44FG6eXtVzWfKWYWyTg4fKlpvwduTw/exec';

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: regPayload,
      });
      console.log('[Registration] Successfully posted registration to Google Sheet webhook.');
    } catch (e) {
      console.warn('Registration webhook delivery failed:', e);
    }
  }

  // 2. Local server (e.g. when running node server.js on port 3001)
  try {
    await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: regPayload,
    });
  } catch {
    // Local server not active, silent continue
  }

  // 3. Commit registration & initialize database summary in TECH_SUMMIT_RESULT repository
  try {
    await pushRegistrationToResultRepo(participant);
  } catch (e) {
    console.warn('[Registration] Result repo sync encountered an error:', e);
  }
}

async function syncSubmissionRemote(
  submission: Submission,
  allBoothResults?: Record<string, BoothResult>
): Promise<boolean> {
  const payload = JSON.stringify(submission, null, 2);

  // 1. Google Sheets Webhook or custom submission endpoint (Excel)
  const webhookUrl = localStorage.getItem('technology-summit-webhook-url') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUBMISSION_ENDPOINT) ||
    'https://script.google.com/macros/s/AKfycbwNSijCcsncqXoBKFBNqq8KrT45sD5BIl9onLwE44FG6eXtVzWfKWYWyTg4fKlpvwduTw/exec';

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
      });
      console.log('[Submission] Successfully posted test result to Google Sheet webhook.');
    } catch (e) {
      console.warn('Webhook delivery failed:', e);
    }
  }

  // 2. Try local server (e.g. when running node server.js on port 3001)
  try {
    const res = await fetch('http://localhost:3001/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    if (res.ok) console.log('[Submission] Successfully stored on local submissions server.');
  } catch {
    // Local server not active, silent continue
  }

  // 3. Commit to GitHub Result Repository (https://github.com/krishnakumarsabbu-prog/TECH_SUMMIT_RESULT.git)
  // Saves results/{EntID}/booth-{number}.json and updates results/{EntID}/summary.json
  try {
    await pushTestResultToResultRepo(submission.participant, submission, allBoothResults || {});
  } catch (e) {
    console.warn('[GitHub Result Repo] Error syncing test result:', e);
  }

  return true;
}

export async function submitResult(
  participant: Participant,
  quizState: QuizState,
  result: QuizResult,
  boothsCompletedSoFar: number = 1,
  allBoothResults?: Record<string, BoothResult>,
): Promise<Submission> {
  // 1. Generate standard submission schema
  const submission = await generateSubmission(participant, quizState, result, boothsCompletedSoFar);

  // 2. Persist in local storage so participant reports are stored inside the project
  saveSubmissionRecord(submission);

  // 3. Dispatch to remote backend / Google Sheets / GitHub result repo without blocking UI
  syncSubmissionRemote(submission, allBoothResults).catch((err) => {
    console.info('Remote sync background info:', err);
  });

  return submission;
}

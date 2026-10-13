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
 * Registers participant and syncs ONLY to:
 * GitHub repository: https://github.com/krishnakumarsabbu-prog/TECH_SUMMIT_RESULT.git
 *   - creates results/{EntID}/registration.json
 *   - initializes results/{EntID}/summary.json
 */
export async function registerParticipant(participant: Participant): Promise<void> {
  // Push registration & initialize summary to GitHub TECH_SUMMIT_RESULT repository
  try {
    await pushRegistrationToResultRepo(participant);
    console.log(`[Registration] ✓ Registered ${participant.entId} in GitHub result repo.`);
  } catch (e) {
    console.warn('[Registration] GitHub result repo sync encountered an error:', e);
  }
}

/**
 * Syncs submission results ONLY to:
 * GitHub repository: https://github.com/krishnakumarsabbu-prog/TECH_SUMMIT_RESULT.git
 *   - saves results/{EntID}/booth-{number}.json
 *   - updates results/{EntID}/summary.json
 */
async function syncSubmissionToGitHub(
  submission: Submission,
  allBoothResults: Record<string, BoothResult>
): Promise<boolean> {
  try {
    await pushTestResultToResultRepo(submission.participant, submission, allBoothResults);
    console.log(`[GitHub Sync] ✓ Pushed booth ${submission.booth?.boothNumber} result for ${submission.participant.entId}`);
    return true;
  } catch (e) {
    console.warn('[GitHub Result Repo] Error syncing test result:', e);
    return false;
  }
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

  // 2. Persist in local storage
  saveSubmissionRecord(submission);

  // 3. Push to GitHub result repository without blocking UI
  syncSubmissionToGitHub(submission, allBoothResults || {}).catch((err) => {
    console.info('GitHub sync background info:', err);
  });

  return submission;
}

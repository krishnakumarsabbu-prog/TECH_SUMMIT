import type {
  Participant,
  Participation,
  QuizState,
  QuizResult,
  Submission,
} from '../types';
import { collectDeviceMetadata } from '../utils/deviceFingerprint';
import { generateParticipationKey } from '../utils/participation';
import { buildSubmission, validateSubmission } from '../utils/submission';
import { saveSubmissionRecord } from '../utils/storage';

export async function generateSubmission(
  participant: Participant,
  quizState: QuizState,
  result: QuizResult,
): Promise<Submission> {
  const device = collectDeviceMetadata();
  const participationKey = await generateParticipationKey(participant);
  const participation: Participation = {
    deviceId: device.deviceId,
    participationKey,
    attemptNumber: 1,
  };

  const submission = buildSubmission(participant, device, participation, quizState, result);
  if (!validateSubmission(submission)) {
    throw new Error('Generated submission failed validation.');
  }
  return submission;
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function syncSubmissionRemote(submission: Submission): Promise<boolean> {
  const payload = JSON.stringify(submission, null, 2);

  // 1. Check for configured submission webhook or API endpoint
  const webhookUrl = localStorage.getItem('technology-summit-webhook-url') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUBMISSION_ENDPOINT) ||
    '';

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      return true;
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
    if (res.ok) return true;
  } catch {
    // Local server not active, silent continue
  }

  // 3. Commit directly to GitHub repository (krishnakumarsabbu-prog/TECH_SUMMIT/submissions/)
  const ghToken = localStorage.getItem('technology-summit-github-token') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GITHUB_TOKEN) ||
    atob('Z2l0aHViX3BhdF8xMUI3REtHTlEwZjZpQjVpczZmQ2RxX0lZYTBtY0dGQUdBM05vNkJrclhWcXd5Nldadlg5TjV4MW5uU1RzT3RnM0dPUERSU0FRV3JHcWxYUXda');

  if (ghToken) {
    try {
      const fileName = `submission_${submission.submission.submissionId}.json`;
      const base64Content = toBase64Utf8(payload);
      const commitMsg = `Add ${fileName} (${submission.participant.name} - ${submission.participant.company})`;

      const res = await fetch(`https://api.github.com/repos/krishnakumarsabbu-prog/TECH_SUMMIT/contents/submissions/${fileName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ghToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMsg,
          content: base64Content,
        }),
      });

      if (res.ok) {
        console.log(`[GitHub API] Successfully committed ${fileName} to repository.`);
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[GitHub API] Failed to commit submission:', errJson);
      }
    } catch (e) {
      console.warn('[GitHub API] Request error:', e);
    }
  }

  return false;
}


export async function submitResult(
  participant: Participant,
  quizState: QuizState,
  result: QuizResult,
): Promise<Submission> {
  // 1. Generate standard submission schema
  const submission = await generateSubmission(participant, quizState, result);

  // 2. Persist in local storage so participant reports are stored inside the project
  saveSubmissionRecord(submission);

  // 3. Dispatch to remote backend / GitHub repo without blocking or triggering a download
  syncSubmissionRemote(submission).catch((err) => {
    console.info('Remote sync background info:', err);
  });

  // NOTE: downloadSubmissionJSON(submission) disabled so attendees don't receive download prompts
  return submission;
}


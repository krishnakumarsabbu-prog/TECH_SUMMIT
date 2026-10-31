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
import {
  getPendingSubmissions,
  markSubmissionSynced,
  saveSubmissionRecord,
} from '../utils/storage';
import { saveBoothResultInFirestore } from './firebaseService';

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
 * Syncs submission results solely to Firebase Firestore database
 */
const inFlightSyncs = new Map<string, Promise<boolean>>();

function syncSubmission(submission: Submission): Promise<boolean> {
  const syncKey = `${submission.participant.email.toLowerCase()}:${submission.submission.submissionId}`;
  const existingSync = inFlightSyncs.get(syncKey);
  if (existingSync) return existingSync;

  const sync = (async () => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await saveBoothResultInFirestore(submission.participant, submission);
        if (res.success) {
          markSubmissionSynced(submission);
          console.log(`[Submission] ✓ Saved booth ${submission.booth?.boothNumber} result in Firebase for ${submission.participant.email} (attempt ${attempt})`);
          return true;
        }
        console.warn(`[Submission] Firebase attempt ${attempt} failed:`, res.error);
      } catch (e) {
        console.warn(`[Submission] Firebase attempt ${attempt} error:`, e);
      }

      if (attempt < maxRetries) {
        // Exponential backoff: 800ms, 1600ms
        await new Promise((resolve) => setTimeout(resolve, attempt * 800));
      }
    }

    console.warn(`[Submission] Firebase sync unsuccessful after ${maxRetries} attempts; safely retained in device queue.`);
    return false;
  })();

  inFlightSyncs.set(syncKey, sync);
  void sync.then(() => {
    if (inFlightSyncs.get(syncKey) === sync) inFlightSyncs.delete(syncKey);
  });
  return sync;
}

export async function retryPendingSubmissions(email: string): Promise<void> {
  const pending = getPendingSubmissions(email);
  for (const submission of pending) {
    await syncSubmission(submission);
  }
}

export async function submitResult(
  participant: Participant,
  quizState: QuizState,
  result: QuizResult,
  boothsCompletedSoFar: number = 1,
  onSyncStatus?: (status: 'local-save-failed' | 'sync-pending' | 'synced' | 'sync-failed') => void,
): Promise<Submission> {
  // 1. Generate standard submission schema
  const submission = await generateSubmission(participant, quizState, result, boothsCompletedSoFar);

  // 2. Persist in local storage immediately so score is never lost
  saveSubmissionRecord(submission);

  // 3. Hold on until record is saved to Firebase (with 3 automatic retries)
  try {
    const synced = await syncSubmission(submission);
    onSyncStatus?.(synced ? 'synced' : 'sync-failed');
  } catch (err) {
    console.warn('[Submission] Background sync error:', err);
    onSyncStatus?.('sync-failed');
  }

  return submission;
}

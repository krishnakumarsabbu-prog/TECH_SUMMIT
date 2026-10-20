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
  registerParticipantInFirestore,
  saveBoothResultInFirestore,
} from './firebaseService';

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
 * Registers participant solely in Firebase Firestore database
 */
export async function registerParticipant(participant: Participant): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await registerParticipantInFirestore(participant);
    if (res.success) {
      console.log(`[Registration] ✓ Registered participant ${participant.entId} in Firebase Firestore.`);
    } else {
      console.warn(`[Registration] Firebase Firestore returned error:`, res.error);
    }
    return res;
  } catch (e: any) {
    console.warn('[Registration] Firebase Firestore error:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

/**
 * Syncs submission results solely to Firebase Firestore database
 */
async function syncSubmission(
  submission: Submission,
  allBoothResults: Record<string, BoothResult>
): Promise<boolean> {
  try {
    const res = await saveBoothResultInFirestore(submission.participant, submission, allBoothResults);
    if (res.success) {
      console.log(`[Submission] ✓ Saved booth ${submission.booth?.boothNumber} result in Firebase for ${submission.participant.entId}`);
      return true;
    }
    console.warn('[Submission] Failed to save result in Firebase:', res.error);
    return false;
  } catch (e) {
    console.warn('[Submission] Firebase Firestore error:', e);
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

  // 3. Push to Firebase Firestore
  syncSubmission(submission, allBoothResults || {}).catch((err) => {
    console.warn('[Submission] Background sync error:', err);
  });

  return submission;
}

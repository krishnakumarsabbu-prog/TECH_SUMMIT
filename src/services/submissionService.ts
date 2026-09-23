import type {
  Participant,
  Participation,
  QuizState,
  QuizResult,
  Submission,
} from '../types';
import { collectDeviceMetadata } from '../utils/deviceFingerprint';
import { generateParticipationKey } from '../utils/participation';
import { buildSubmission, validateSubmission, downloadSubmissionJSON } from '../utils/submission';

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

export async function submitResult(
  participant: Participant,
  quizState: QuizState,
  result: QuizResult,
): Promise<Submission> {
  // Current implementation: generate + download in the browser.
  // Future implementation: POST to a secure API that stores JSON in a private GitHub repository.
  const submission = await generateSubmission(participant, quizState, result);
  downloadSubmissionJSON(submission);
  return submission;
}

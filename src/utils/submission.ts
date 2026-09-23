import type {
  Participant,
  DeviceMetadata,
  Participation,
  QuizState,
  QuizResult,
  QuizAnswer,
  Submission,
} from '../types';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function generateSubmissionId(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `TS_${y}${m}${d}_${hh}${mm}${ss}_${rand}`;
}

export function buildSubmission(
  participant: Participant,
  device: DeviceMetadata,
  participation: Participation,
  quizState: QuizState,
  result: QuizResult,
): Submission {
  const answers: QuizAnswer[] = quizState.questions.map((q, idx) => {
    const selectedIdx = quizState.answers[idx];
    const selectedAnswer = selectedIdx === null || selectedIdx === undefined ? null : q.options[selectedIdx];
    const correct = selectedIdx === q.correctAnswer;
    return {
      questionId: q.id,
      selectedAnswer,
      correct,
    };
  });

  return {
    schemaVersion: '1.0',
    event: {
      eventId: 'TECHSUMMIT_2026',
      eventName: 'Technology Summit',
    },
    submission: {
      submissionId: generateSubmissionId(),
      completedAt: new Date().toISOString(),
    },
    participant,
    participation,
    device,
    quiz: result,
    answers,
  };
}

export function validateSubmission(submission: Submission): boolean {
  try {
    if (!submission.submission.submissionId) return false;
    if (!submission.participation.participationKey) return false;
    if (submission.quiz.totalQuestions !== submission.answers.length) return false;
    return true;
  } catch {
    return false;
  }
}

export function downloadSubmissionJSON(submission: Submission): void {
  const json = JSON.stringify(submission, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `submission_${submission.submission.submissionId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface Participant {
  name: string;
  company: string;
  role: string;
  email: string;
}

export interface DeviceMetadata {
  deviceId: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  timezoneOffset: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  touchSupport: boolean;
  online: boolean;
}

export interface Participation {
  deviceId: string;
  participationKey: string;
  attemptNumber: number;
}

export interface QuizQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string | null;
  correct: boolean;
}

export interface QuizState {
  questions: QuizQuestion[];
  answers: (number | null)[];
  currentIndex: number;
  startTime: number;
  endTime: number | null;
  submitted: boolean;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredAnswers: number;
  timeTakenSeconds: number;
}

export interface Submission {
  schemaVersion: string;
  event: {
    eventId: string;
    eventName: string;
  };
  submission: {
    submissionId: string;
    completedAt: string;
  };
  participant: Participant;
  participation: Participation;
  device: DeviceMetadata;
  quiz: QuizResult;
  answers: QuizAnswer[];
}

export type AppStage = 'WELCOME' | 'PARTICIPANT' | 'QUIZ' | 'RESULT' | 'ALREADY_PLAYED';

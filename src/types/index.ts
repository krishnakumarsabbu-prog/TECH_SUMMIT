export interface Participant {
  name: string;
  email: string;
  role?: string;
  entId?: string; // Legacy fallback
  lob?: string;   // Legacy fallback
  company?: string;
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

export type ChallengeType = 'mcq' | 'game';

export type GameType =
  | 'zombie_gpu'
  | 'phish_swipe'
  | 'code_roast'
  | 'pipeline_order'
  | 'prompt_whisperer'
  | 'dns_firefighter'
  | 'fraud_blitz'
  | 'emoji_decipher'
  // New fun emoji-based mini-game templates
  | 'memory_missing'
  | 'grid_tap'
  | 'odd_one'
  | 'pair_match'
  | 'sequence'
  | 'timer_stop'
  | 'luck_pick'
  | 'sort_bucket'
  | 'pattern_quiz'
  | 'crowd_judge';

export interface QuizQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number;
  itemType?: ChallengeType;
  gameType?: GameType;
  gameData?: any;
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string | null;
  correct: boolean;
}

export interface BoothTopic {
  id: string; // e.g. "booth-1_topic-1"
  boothId: string; // e.g. "booth-1"
  topicKey: string; // e.g. "topic-1"
  title: string;
  description?: string;
  questions: QuizQuestion[];
  questionCount: number;
}

export interface BoothConfig {
  id: string; // e.g. "booth-1"
  number: number; // 1 to 9
  title: string;
  category: string;
  icon: string;
  badge: string;
  description: string;
  topics?: BoothTopic[];
  questions: QuizQuestion[];
}

export interface QuizState {
  participantEmail: string;
  boothId: string;
  boothNumber: number;
  boothTitle: string;
  topicId?: string;
  topicTitle?: string;
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

export interface BoothResult extends QuizResult {
  boothId: string;
  boothNumber: number;
  boothTitle: string;
  topicId?: string;
  topicTitle?: string;
  completedAt: string;
  answers: QuizAnswer[];
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
  booth?: {
    boothId: string;
    boothNumber: number;
    boothTitle: string;
    topicTitle?: string;
    boothsCompletedSoFar: number;
    isPrizeEligible: boolean;
  };
  participant: Participant;
  participation: Participation;
  device: DeviceMetadata;
  quiz: QuizResult;
  answers: QuizAnswer[];
}

export type AppStage = 'WELCOME' | 'PARTICIPANT' | 'TOPIC_SELECTION' | 'QUIZ' | 'RESULT' | 'ALREADY_PLAYED' | 'PASSPORT';

import type { AppStage, Participant, QuizState, QuizResult } from '../types';

export const KEYS = {
  DEVICE_ID: 'technology-summit-device-id',
  PARTICIPANT: 'technology-summit-participant',
  PLAYED: 'technology-summit-played',
  RESULT: 'technology-summit-result',
  QUIZ_STATE: 'technology-summit-quiz-state',
} as const;

function isStorageAvailable(): boolean {
  try {
    const test = '__ts_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

const available = isStorageAvailable();

function safeGet(key: string): string | null {
  if (!available) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (!available) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota errors
  }
}

function safeRemove(key: string): void {
  if (!available) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getDeviceId(): string {
  let id = safeGet(KEYS.DEVICE_ID);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    safeSet(KEYS.DEVICE_ID, id);
  }
  return id;
}

export function saveParticipant(participant: Participant): void {
  safeSet(KEYS.PARTICIPANT, JSON.stringify(participant));
}

export function getParticipant(): Participant | null {
  const raw = safeGet(KEYS.PARTICIPANT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Participant;
  } catch {
    return null;
  }
}

export function markPlayed(): void {
  safeSet(KEYS.PLAYED, 'true');
}

export function hasPlayed(): boolean {
  return safeGet(KEYS.PLAYED) === 'true';
}

export function saveResult(result: QuizResult): void {
  safeSet(KEYS.RESULT, JSON.stringify(result));
}

export function getResult(): QuizResult | null {
  const raw = safeGet(KEYS.RESULT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuizResult;
  } catch {
    return null;
  }
}

export function saveQuizState(state: QuizState): void {
  safeSet(KEYS.QUIZ_STATE, JSON.stringify(state));
}

export function getQuizState(): QuizState | null {
  const raw = safeGet(KEYS.QUIZ_STATE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuizState;
    if (
      !Array.isArray(parsed.questions) ||
      !Array.isArray(parsed.answers) ||
      typeof parsed.startTime !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuizState(): void {
  safeRemove(KEYS.QUIZ_STATE);
}

export function resetAll(): void {
  safeRemove(KEYS.PARTICIPANT);
  safeRemove(KEYS.PLAYED);
  safeRemove(KEYS.RESULT);
  safeRemove(KEYS.QUIZ_STATE);
}

export function isTestMode(): boolean {
  return new URLSearchParams(window.location.search).get('testMode') === 'true';
}

export function determineInitialStage(): AppStage {
  if (hasPlayed()) return 'ALREADY_PLAYED';
  if (getQuizState()) return 'QUIZ';
  if (getParticipant()) return 'PARTICIPANT';
  return 'WELCOME';
}

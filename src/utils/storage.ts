import type { Participant, QuizState, QuizResult, BoothResult } from '../types';
import { REQUIRED_BOOTHS_TO_WIN } from '../data/boothsConfig';

export const KEYS = {
  DEVICE_ID: 'technology-summit-device-id',
  PARTICIPANT: 'technology-summit-participant',
  PLAYED: 'technology-summit-played',
  RESULT: 'technology-summit-result',
  QUIZ_STATE: 'technology-summit-quiz-state',
  BOOTH_RESULTS: 'technology-summit-booth-results',
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

// Multi-booth storage methods
export function getBoothResults(): Record<string, BoothResult> {
  const raw = safeGet(KEYS.BOOTH_RESULTS);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveBoothResult(result: BoothResult): void {
  const all = getBoothResults();
  all[result.boothId] = result;
  safeSet(KEYS.BOOTH_RESULTS, JSON.stringify(all));
}

export function getBoothResult(boothId: string): BoothResult | null {
  const all = getBoothResults();
  return all[boothId] || null;
}

export function hasPlayedBooth(boothId: string): boolean {
  const all = getBoothResults();
  return Boolean(all[boothId]);
}

export function getCompletedBoothCount(): number {
  const all = getBoothResults();
  return Object.keys(all).length;
}

export function getCompletedBoothsList(): BoothResult[] {
  const all = getBoothResults();
  return Object.values(all).sort((a, b) => a.boothNumber - b.boothNumber);
}

export function isQualifiedWinner(): boolean {
  return getCompletedBoothCount() >= REQUIRED_BOOTHS_TO_WIN;
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
  safeRemove(KEYS.BOOTH_RESULTS);
}

const SUBMISSIONS_KEY = 'technology-summit-all-submissions';

export function saveSubmissionRecord(submission: any): void {
  const existingRaw = safeGet(SUBMISSIONS_KEY);
  let list: any[] = [];
  if (existingRaw) {
    try {
      list = JSON.parse(existingRaw);
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }
  list.push(submission);
  safeSet(SUBMISSIONS_KEY, JSON.stringify(list));
}

export function getAllSubmissions(): any[] {
  const existingRaw = safeGet(SUBMISSIONS_KEY);
  if (!existingRaw) return [];
  try {
    const parsed = JSON.parse(existingRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearAllSubmissions(): void {
  safeRemove(SUBMISSIONS_KEY);
}

export function isTestMode(): boolean {
  return new URLSearchParams(window.location.search).get('testMode') === 'true';
}

export function getBoothParamFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('booth') || params.get('b');
}

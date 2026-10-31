import type { Participant, QuizState, QuizResult, BoothResult, Submission } from '../types';
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

function safeSet(key: string, value: string): boolean {
  if (!available) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
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

function getParticipantStorageKey(baseKey: string, email?: string): string {
  const normalizedEmail = (email || getParticipant()?.email || '').trim().toLowerCase();
  return normalizedEmail ? `${baseKey}:${encodeURIComponent(normalizedEmail)}` : baseKey;
}

// Multi-booth storage methods
export function getBoothResults(email?: string): Record<string, BoothResult> {
  const scopedKey = getParticipantStorageKey(KEYS.BOOTH_RESULTS, email);
  const raw = safeGet(scopedKey);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function migrateLegacyBoothResults(email: string): void {
  const scopedKey = getParticipantStorageKey(KEYS.BOOTH_RESULTS, email);
  if (safeGet(scopedKey)) return;

  const legacyRaw = safeGet(KEYS.BOOTH_RESULTS);
  if (legacyRaw && safeSet(scopedKey, legacyRaw)) {
    safeRemove(KEYS.BOOTH_RESULTS);
  }
}

export function saveBoothResult(result: BoothResult, email?: string): boolean {
  const all = getBoothResults(email);
  all[result.boothId] = result;
  return safeSet(getParticipantStorageKey(KEYS.BOOTH_RESULTS, email), JSON.stringify(all));
}

export function saveAllBoothResults(all: Record<string, BoothResult>, email?: string): boolean {
  const existing = getBoothResults(email);
  const merged = { ...existing, ...all };
  return safeSet(getParticipantStorageKey(KEYS.BOOTH_RESULTS, email), JSON.stringify(merged));
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
      typeof parsed.startTime !== 'number' ||
      !parsed.boothId ||
      typeof parsed.participantEmail !== 'string' ||
      !parsed.participantEmail.trim() ||
      typeof parsed.submitted !== 'boolean'
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
  const participantEmail = getParticipant()?.email;
  safeRemove(KEYS.PARTICIPANT);
  safeRemove(KEYS.PLAYED);
  safeRemove(KEYS.RESULT);
  safeRemove(KEYS.QUIZ_STATE);
  safeRemove(getParticipantStorageKey(KEYS.BOOTH_RESULTS, participantEmail));
  clearAllSubmissions(participantEmail);
  safeRemove(SUBMISSIONS_KEY);
  safeRemove(PENDING_SUBMISSIONS_KEY);
}

const SUBMISSIONS_KEY = 'technology-summit-all-submissions';
const PENDING_SUBMISSIONS_KEY = 'technology-summit-pending-submissions';

export function saveSubmissionRecord(submission: Submission): boolean {
  const email = submission.participant.email;
  const submissionsKey = getParticipantStorageKey(SUBMISSIONS_KEY, email);
  const pendingKey = getParticipantStorageKey(PENDING_SUBMISSIONS_KEY, email);
  const existingRaw = safeGet(submissionsKey);
  let list: Submission[] = [];
  if (existingRaw) {
    try {
      list = JSON.parse(existingRaw);
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }
  const submissionId = submission.submission.submissionId;
  if (!list.some((saved) => saved.submission.submissionId === submissionId)) {
    list.push(submission);
  }

  const pendingRaw = safeGet(pendingKey);
  let pending: Submission[] = [];
  if (pendingRaw) {
    try {
      const parsed = JSON.parse(pendingRaw);
      if (Array.isArray(parsed)) pending = parsed as Submission[];
    } catch {
      pending = [];
    }
  }
  if (!pending.some((saved) => saved.submission.submissionId === submissionId)) {
    pending.push(submission);
  }

  const savedArchive = safeSet(submissionsKey, JSON.stringify(list));
  const savedPending = safeSet(pendingKey, JSON.stringify(pending));
  return savedArchive && savedPending;
}

export function getAllSubmissions(email?: string): Submission[] {
  const existingRaw = safeGet(getParticipantStorageKey(SUBMISSIONS_KEY, email));
  if (!existingRaw) return [];
  try {
    const parsed = JSON.parse(existingRaw);
    return Array.isArray(parsed) ? parsed as Submission[] : [];
  } catch {
    return [];
  }
}

export function getPendingSubmissions(email?: string): Submission[] {
  const pendingRaw = safeGet(getParticipantStorageKey(PENDING_SUBMISSIONS_KEY, email));
  if (!pendingRaw) return [];
  try {
    const parsed = JSON.parse(pendingRaw);
    return Array.isArray(parsed) ? parsed as Submission[] : [];
  } catch {
    return [];
  }
}

export function markSubmissionSynced(submission: Submission): boolean {
  const pendingKey = getParticipantStorageKey(PENDING_SUBMISSIONS_KEY, submission.participant.email);
  const pending = getPendingSubmissions(submission.participant.email)
    .filter((saved) => saved.submission.submissionId !== submission.submission.submissionId);
  return safeSet(pendingKey, JSON.stringify(pending));
}

export function clearAllSubmissions(email?: string): void {
  safeRemove(getParticipantStorageKey(SUBMISSIONS_KEY, email));
  safeRemove(getParticipantStorageKey(PENDING_SUBMISSIONS_KEY, email));
}

export function isTestMode(): boolean {
  return new URLSearchParams(window.location.search).get('testMode') === 'true';
}

export function getBoothParamFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('booth') || params.get('b');
}

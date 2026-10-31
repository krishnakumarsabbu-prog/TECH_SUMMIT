import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  collectionGroup,
  getDocs,
} from 'firebase/firestore';
import type { Participant, BoothResult, Submission } from '../types';
import { collectDeviceMetadata } from '../utils/deviceFingerprint';
import { getBoothResults } from '../utils/storage';
import { REQUIRED_BOOTHS_TO_WIN } from '../data/boothsConfig';

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN01MPv0CZyrytoGiE-ncNTbN1do5chPY",
  authDomain: "innovation-showcase-2026-d19de.firebaseapp.com",
  projectId: "innovation-showcase-2026-d19de",
  storageBucket: "innovation-showcase-2026-d19de.firebasestorage.app",
  messagingSenderId: "178394050941",
  appId: "1:178394050941:web:7c85ec9b28571981ec1c14"
};

// Initialize Firebase singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export interface ParticipantFetchResult {
  exists: boolean;
  participant?: Participant;
  summary?: any;
  boothResults?: Record<string, BoothResult>;
  error?: string;
}

export function getParticipantDocKey(p: Partial<Participant> | string): string {
  if (typeof p === 'string') {
    return p.trim().toLowerCase();
  }
  return (p.email || p.entId || 'UNKNOWN').trim().toLowerCase();
}

/**
 * Saves clean booth quiz result in subcollection `booths/{booth-N}`,
 * and updates parent `participants/{email}` with device info & live summary.
 */
export async function saveBoothResultInFirestore(
  participant: Participant,
  submission: Submission,
): Promise<{ success: boolean; error?: string }> {
  const docKey = getParticipantDocKey(participant);
  if (!docKey || docKey === 'unknown') {
    return { success: false, error: 'Invalid participant email' };
  }

  const boothNumber = submission.booth?.boothNumber || 1;
  const boothId = submission.booth?.boothId || `booth-${boothNumber}`;
  const now = submission.submission?.completedAt || new Date().toISOString();

  try {
    // 1. Lightweight booth document: only booth test scores and answers
    const boothDocRef = doc(db, 'participants', docKey, 'booths', `booth-${boothNumber}`);
    const boothData = {
      boothNumber,
      boothId,
      boothTitle: submission.booth?.boothTitle || `Booth ${boothNumber}`,
      topicTitle: submission.booth?.topicTitle || '',
      completedAt: now,
      score: submission.quiz.score,
      totalQuestions: submission.quiz.totalQuestions,
      percentage: submission.quiz.percentage,
      timeTakenSeconds: submission.quiz.timeTakenSeconds,
      answers: submission.answers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        correct: a.correct,
      })),
    };
    await setDoc(boothDocRef, boothData);

    // 2. Update parent document (participants/{email}): Device details & Overall summary
    const participantRef = doc(db, 'participants', docKey);
    const localResults = getBoothResults(docKey);
    const allResults = {
      ...localResults,
      [boothId]: {
        score: submission.quiz.score,
        totalQuestions: submission.quiz.totalQuestions,
        timeTakenSeconds: submission.quiz.timeTakenSeconds,
      },
    };

    let totalScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    const completedList = Object.values(allResults);
    completedList.forEach((r: any) => {
      totalScore += r.score || 0;
      totalQuestions += r.totalQuestions || 0;
      totalTime += r.timeTakenSeconds || 0;
    });

    const boothsCompleted = completedList.length;
    const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const isTargetReached = boothsCompleted >= REQUIRED_BOOTHS_TO_WIN;

    await setDoc(
      participantRef,
      {
        name: participant.name,
        email: docKey,
        role: participant.role || 'Summit Attendee',
        lastActiveAt: now,
        device: collectDeviceMetadata(),
        summary: {
          boothsCompleted,
          totalScore,
          totalQuestions,
          accuracy,
          totalTimeSeconds: totalTime,
          isTargetReached,
          isPrizeEligible: isTargetReached,
        },
      },
      { merge: true },
    );

    console.log(`[Firestore] ✓ Saved clean booth ${boothNumber} result & updated participant summary for ${docKey}`);
    return { success: true };
  } catch (err: any) {
    console.warn(`[Firestore] Error saving booth result for ${docKey}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Saves new participant registration with device metadata and initial empty summary.
 */
export async function saveParticipantRegistrationInFirestore(
  participant: Participant,
): Promise<{ success: boolean; error?: string }> {
  const docKey = getParticipantDocKey(participant);
  if (!docKey || docKey === 'unknown') {
    return { success: false, error: 'Invalid participant email' };
  }

  const now = new Date().toISOString();

  try {
    await setDoc(
      doc(db, 'participants', docKey),
      {
        name: participant.name,
        email: docKey,
        role: participant.role || 'Summit Attendee',
        registeredAt: now,
        lastActiveAt: now,
        device: collectDeviceMetadata(),
        summary: {
          boothsCompleted: 0,
          totalScore: 0,
          totalQuestions: 0,
          accuracy: 0,
          totalTimeSeconds: 0,
          isTargetReached: false,
          isPrizeEligible: false,
        },
      },
      { merge: true },
    );
    console.log(`[Firestore] ✓ Saved participant registration with device metadata for ${docKey}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.warn(`[Firestore] Error saving participant registration for ${docKey}:`, err);
    return { success: false, error };
  }
}

/**
 * Fetches participant details, device profile, and all completed booth records from Firestore.
 */
export async function fetchParticipantFromFirestore(identifier: string): Promise<ParticipantFetchResult> {
  const cleanId = (identifier || '').trim().toLowerCase();
  if (!cleanId) return { exists: false };

  try {
    const docKeys = [cleanId];
    if (!cleanId.includes('@') && cleanId.toUpperCase() !== cleanId) {
      docKeys.push(cleanId.toUpperCase());
    }

    for (const docKey of docKeys) {
      const participantRef = doc(db, 'participants', docKey);
      const [boothsSnap, participantSnap] = await Promise.all([
        getDocs(collection(participantRef, 'booths')),
        getDoc(participantRef),
      ]);

      if (participantSnap.exists() || !boothsSnap.empty) {
        const pData = participantSnap.exists() ? participantSnap.data() : {};
        const firstBoothData = !boothsSnap.empty ? boothsSnap.docs[0].data() : {};

        const participant: Participant = {
          name: pData.name || firstBoothData.participant?.name || '',
          email: pData.email || cleanId,
          role: pData.role || 'Summit Attendee',
        };

        const boothResults: Record<string, BoothResult> = {};

        boothsSnap.forEach((boothDoc: any) => {
          const b = boothDoc.data();
          const boothNumber = b.boothNumber || b.booth?.boothNumber || Number(boothDoc.id.match(/\d+/)?.[0]) || 1;
          const boothId = b.boothId || b.booth?.boothId || `booth-${boothNumber}`;
          const score = b.score ?? b.quiz?.score ?? 0;
          const totalQuestions = b.totalQuestions ?? b.quiz?.totalQuestions ?? 0;
          const percentage = b.percentage ?? b.quiz?.percentage ?? (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);
          const timeTakenSeconds = b.timeTakenSeconds ?? b.quiz?.timeTakenSeconds ?? 0;

          boothResults[boothId] = {
            boothId,
            boothNumber,
            boothTitle: b.boothTitle || b.booth?.boothTitle || `Booth ${boothNumber}`,
            topicId: b.topicId || b.booth?.topicId,
            topicTitle: b.topicTitle || b.booth?.topicTitle || b.boothTitle || `Booth ${boothNumber}`,
            score,
            totalQuestions,
            percentage,
            correctAnswers: b.correctAnswers ?? score,
            incorrectAnswers: b.incorrectAnswers ?? Math.max(0, totalQuestions - score),
            unansweredAnswers: b.unansweredAnswers ?? 0,
            timeTakenSeconds,
            completedAt: b.completedAt || b.submission?.completedAt || b.savedAt || new Date().toISOString(),
            answers: b.answers || [],
          };
        });

        return {
          exists: true,
          participant,
          summary: pData.summary || {},
          boothResults,
        };
      }
    }

    return { exists: false };
  } catch (err: any) {
    console.warn(`[Firestore] Error fetching participant ${cleanId}:`, err);
    return { exists: false, error: err.message };
  }
}

/**
 * Tests connection to Firestore database
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string; projectId: string }> {
  try {
    const pingRef = doc(db, '_connection_test', 'ping');
    await setDoc(pingRef, { timestamp: new Date().toISOString() });
    return {
      success: true,
      message: `Successfully connected to Firestore Project: ${firebaseConfig.projectId}`,
      projectId: firebaseConfig.projectId,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Firestore: ${err.message}`,
      projectId: firebaseConfig.projectId,
    };
  }
}

/**
 * Fetches all participants from Firestore for admin analytics & dashboard sync
 */
export async function fetchAllParticipants(): Promise<Record<string, unknown>[]> {
  try {
    const [participantsSnap, boothsSnap] = await Promise.all([
      getDocs(collection(db, 'participants')),
      getDocs(collectionGroup(db, 'booths')),
    ]);
    const participants = new Map<string, Record<string, unknown>>();
    participantsSnap.forEach((participantDoc: any) => {
      const participant = participantDoc.data();
      const email = String(participant.email || participantDoc.id).trim().toLowerCase();
      if (email) participants.set(email, participant);
    });
    boothsSnap.forEach((boothDoc: any) => {
      const data = boothDoc.data();
      const participant = data.participant || {};
      const email = String(participant.email || '').trim().toLowerCase();
      if (email && !participants.has(email)) {
        participants.set(email, participant as Record<string, unknown>);
      }
    });
    return [...participants.values()];
  } catch (err) {
    console.warn('[Firestore] Error fetching all participants:', err);
    throw err;
  }
}

/**
 * Fetches all submissions from Firestore for admin analytics & dashboard sync
 */
export async function fetchAllSubmissions(): Promise<Record<string, unknown>[]> {
  try {
    const [boothResultsSnap, legacySubmissionsSnap] = await Promise.all([
      getDocs(collectionGroup(db, 'booths')),
      getDocs(collection(db, 'submissions')),
    ]);
    const submissions = new Map<string, Record<string, unknown>>();

    // Older versions wrote the same attempt into both collections. Deduplicate
    // those while including booth-only records written by the current schema.
    boothResultsSnap.forEach((submissionDoc: any) => {
      const data = submissionDoc.data();
      const id = data.submission?.submissionId || submissionDoc.ref.path;
      submissions.set(id, data);
    });
    legacySubmissionsSnap.forEach((submissionDoc: any) => {
      const data = submissionDoc.data();
      const id = data.submission?.submissionId || submissionDoc.id;
      submissions.set(id, data);
    });

    return [...submissions.values()];
  } catch (err) {
    console.warn('[Firestore] Error fetching all submissions:', err);
    throw err;
  }
}

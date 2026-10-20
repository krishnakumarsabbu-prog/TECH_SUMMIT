import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import type { Participant, BoothResult, Submission } from '../types';

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyCya0vK44ibwcSLKWvPRK7YTYrsKgUAWOA',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'tech-summit-2026-c9d17.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'tech-summit-2026-c9d17',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'tech-summit-2026-c9d17.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '491544199634',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:491544199634:web:992c9b3f891212ae9d480b',
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

/**
 * Registers participant in Firestore: participants/{entId}
 * Preserves any existing test results using { merge: true }.
 */
export async function registerParticipantInFirestore(participant: Participant): Promise<{ success: boolean; error?: string }> {
  const entId = (participant.entId || 'UNKNOWN').trim().toUpperCase();
  if (!entId || entId === 'UNKNOWN') {
    return { success: false, error: 'Invalid Enterprise ID' };
  }

  const now = new Date().toISOString();
  const participantRef = doc(db, 'participants', entId);

  try {
    const existingSnap = await getDoc(participantRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    const registrationData = {
      entId,
      name: participant.name,
      lob: participant.lob || 'N/A',
      company: participant.company || 'Wells Fargo',
      role: participant.role || 'Summit Attendee',
      registeredAt: existingData?.registeredAt || now,
      status: 'REGISTERED',
      totalTestsAppeared: existingData?.totalTestsAppeared || 0,
      totalScore: existingData?.totalScore || 0,
      totalQuestions: existingData?.totalQuestions || 0,
      overallAccuracy: existingData?.overallAccuracy || 0,
      isPrizeEligible: existingData?.isPrizeEligible || false,
      tests: existingData?.tests || [],
      lastUpdated: now,
    };

    await setDoc(participantRef, registrationData, { merge: true });
    console.log(`[Firestore] ✓ Registered participant ${entId} (${participant.name})`);
    return { success: true };
  } catch (err: any) {
    console.warn(`[Firestore] Failed to register participant ${entId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Saves completed booth quiz result into:
 * 1. Subcollection: participants/{entId}/booths/booth-{boothNumber}
 * 2. Root document: participants/{entId} (recalculated summary & prize eligibility)
 * 3. Flat collection: submissions/{submissionId} (for live analytics & export)
 */
export async function saveBoothResultInFirestore(
  participant: Participant,
  submission: Submission,
  allBoothResults: Record<string, BoothResult>
): Promise<{ success: boolean; error?: string }> {
  const entId = (participant.entId || 'UNKNOWN').trim().toUpperCase();
  const boothNumber = submission.booth?.boothNumber || 1;
  const now = submission.submission?.completedAt || new Date().toISOString();

  try {
    // 1. Save specific booth result in subcollection
    const boothDocRef = doc(db, 'participants', entId, 'booths', `booth-${boothNumber}`);
    await setDoc(boothDocRef, {
      ...submission,
      savedAt: now,
    });

    // 2. Also save to flat collection for real-time summit analytics & export
    const subId = submission.submission?.submissionId || `TS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const submissionRef = doc(db, 'submissions', subId);
    await setDoc(submissionRef, {
      ...submission,
      savedAt: now,
    });

    // 3. Recalculate participant aggregated summary
    const completedList = Object.values(allBoothResults);
    let totalScore = 0;
    let totalQuestions = 0;
    completedList.forEach((r) => {
      totalScore += r.score;
      totalQuestions += r.totalQuestions;
    });

    const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const totalTests = completedList.length;

    const summaryData = {
      entId,
      name: participant.name,
      lob: participant.lob || 'N/A',
      company: participant.company || 'Wells Fargo',
      role: participant.role || 'Summit Attendee',
      totalTestsAppeared: totalTests,
      totalScore,
      totalQuestions,
      overallAccuracy: accuracy,
      isPrizeEligible: totalTests >= 4,
      lastUpdated: now,
      tests: completedList.map((r) => ({
        boothId: r.boothId,
        boothNumber: r.boothNumber,
        boothTitle: r.boothTitle,
        topicTitle: r.topicTitle || 'Standard Topic',
        score: r.score,
        totalQuestions: r.totalQuestions,
        percentage: r.percentage,
        timeTakenSeconds: r.timeTakenSeconds,
        completedAt: r.completedAt,
      })),
    };

    const participantRef = doc(db, 'participants', entId);
    await setDoc(participantRef, summaryData, { merge: true });

    console.log(`[Firestore] ✓ Saved booth ${boothNumber} result for ${entId} (Total tests: ${totalTests})`);
    return { success: true };
  } catch (err: any) {
    console.warn(`[Firestore] Error saving booth result for ${entId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches participant details and all completed booth records from Firestore.
 * Executed when participant inputs their Enterprise ID on any device.
 */
export async function fetchParticipantFromFirestore(entId: string): Promise<ParticipantFetchResult> {
  const cleanId = (entId || '').trim().toUpperCase();
  if (!cleanId) return { exists: false };

  try {
    const participantRef = doc(db, 'participants', cleanId);
    const snap = await getDoc(participantRef);

    if (!snap.exists()) {
      return { exists: false };
    }

    const data = snap.data();
    const participant: Participant = {
      name: data.name || '',
      entId: cleanId,
      lob: data.lob || '',
      company: data.company || 'Wells Fargo',
      role: data.role || 'Summit Attendee',
    };

    // Retrieve all completed booth results from subcollection
    const boothsCol = collection(db, 'participants', cleanId, 'booths');
    const boothsSnap = await getDocs(boothsCol);
    const boothResults: Record<string, BoothResult> = {};

    boothsSnap.forEach((docSnap: any) => {
      const bData = docSnap.data();
      const boothNumber = bData.booth?.boothNumber || 1;
      const bId = bData.booth?.boothId || `booth-${boothNumber}`;

      boothResults[bId] = {
        boothId: bId,
        boothNumber,
        boothTitle: bData.booth?.boothTitle || `Booth ${boothNumber}`,
        topicId: bData.booth?.topicId,
        topicTitle: bData.booth?.topicTitle || 'Standard Topic',
        score: bData.quiz?.score ?? 0,
        totalQuestions: bData.quiz?.totalQuestions ?? 0,
        percentage: bData.quiz?.percentage ?? 0,
        correctAnswers: bData.quiz?.correctAnswers ?? 0,
        incorrectAnswers: bData.quiz?.incorrectAnswers ?? 0,
        unansweredAnswers: bData.quiz?.unansweredAnswers ?? 0,
        timeTakenSeconds: bData.quiz?.timeTakenSeconds ?? 0,
        completedAt: bData.submission?.completedAt || bData.savedAt || new Date().toISOString(),
        answers: bData.answers || [],
      };
    });

    return {
      exists: true,
      participant,
      summary: data,
      boothResults,
    };
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
export async function fetchAllParticipants(): Promise<any[]> {
  try {
    const participantsCol = collection(db, 'participants');
    const snap = await getDocs(participantsCol);
    const list: any[] = [];
    snap.forEach((d: any) => {
      list.push(d.data());
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Error fetching all participants:', err);
    return [];
  }
}

/**
 * Fetches all submissions from Firestore for admin analytics & dashboard sync
 */
export async function fetchAllSubmissions(): Promise<any[]> {
  try {
    const subsCol = collection(db, 'submissions');
    const snap = await getDocs(subsCol);
    const list: any[] = [];
    snap.forEach((d: any) => {
      list.push(d.data());
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Error fetching all submissions:', err);
    return [];
  }
}


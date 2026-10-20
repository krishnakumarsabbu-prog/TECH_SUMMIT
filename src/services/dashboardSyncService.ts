import { fetchAllParticipants, fetchAllSubmissions } from './firebaseService';
import { generateDashboardHtml } from './dashboardHtmlGenerator';

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Summit2026!',
};

export function validateAdminLogin(user: string, pass: string): boolean {
  return (
    user.trim().toLowerCase() === ADMIN_CREDENTIALS.username &&
    pass.trim() === ADMIN_CREDENTIALS.password
  );
}

export function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface DashboardSummary {
  generatedAt: string;
  summitName: string;
  targetRepo: string;
  stats: {
    totalRegisteredParticipants: number;
    totalSubmissionsRecorded: number;
    totalPrizeEligibleAttendees: number;
    summitAverageAccuracy: number;
    totalScoreAwarded: number;
    totalQuestionsAnswered: number;
  };
  boothBreakdown: Array<{
    boothNumber: number;
    boothTitle: string;
    totalAttempts: number;
    averageScore: number;
    averageAccuracy: number;
    averageTimeSeconds: number;
  }>;
  lobBreakdown: Array<{
    lob: string;
    participantCount: number;
    averageScore: number;
    prizeEligibleCount: number;
  }>;
  leaderboard: Array<{
    rank: number;
    entId: string;
    name: string;
    lob: string;
    totalScore: number;
    totalQuestions: number;
    overallAccuracy: number;
    totalTestsAppeared: number;
    isPrizeEligible: boolean;
    lastUpdated: string;
  }>;
  prizeEligibleWinners: Array<{
    rank: number;
    entId: string;
    name: string;
    lob: string;
    totalScore: number;
    overallAccuracy: number;
    totalTestsAppeared: number;
  }>;
  participants: any[];
}

const BOOTH_TITLES: Record<number, string> = {
  1: 'Generative AI & LLMs',
  2: 'Cloud Native & Kubernetes',
  3: 'Cybersecurity & Zero Trust',
  4: 'Data Engineering & Lakehouse',
  5: 'DevOps, SRE & CI/CD',
  6: 'Software Architecture & APIs',
  7: 'IoT & Edge Computing',
  8: 'Web3 & Distributed Ledgers',
  9: 'Quantum & Emerging Horizons',
};

/**
 * Builds the comprehensive Summit Dashboard JSON from Firestore collections
 */
export async function buildDashboardData(): Promise<DashboardSummary> {
  const participants = await fetchAllParticipants();
  const submissions = await fetchAllSubmissions();
  const repo = (import.meta as any).env?.VITE_GITHUB_RESULT_REPO || 'krishnakumarsabbu-prog/TECH_SUMMIT_RESULT';

  const totalRegistered = participants.length;
  const totalSubmissions = submissions.length;

  let totalScoreAwarded = 0;
  let totalQuestionsAnswered = 0;
  let prizeEligibleCount = 0;

  // 1. Group submissions by boothNumber
  const boothStatsMap = new Map<number, {
    totalAttempts: number;
    totalScore: number;
    totalQuestions: number;
    totalTime: number;
  }>();

  for (let b = 1; b <= 9; b++) {
    boothStatsMap.set(b, { totalAttempts: 0, totalScore: 0, totalQuestions: 0, totalTime: 0 });
  }

  for (const sub of submissions) {
    const bNum = Number(sub.boothNumber) || 1;
    const stats = boothStatsMap.get(bNum) || { totalAttempts: 0, totalScore: 0, totalQuestions: 0, totalTime: 0 };
    stats.totalAttempts += 1;
    stats.totalScore += Number(sub.score) || 0;
    stats.totalQuestions += Number(sub.totalQuestions) || 5;
    stats.totalTime += Number(sub.timeTakenSeconds) || 0;
    boothStatsMap.set(bNum, stats);

    totalScoreAwarded += Number(sub.score) || 0;
    totalQuestionsAnswered += Number(sub.totalQuestions) || 5;
  }

  const boothBreakdown = Array.from(boothStatsMap.entries()).map(([boothNum, stats]) => {
    const avgScore = stats.totalAttempts > 0 ? Number((stats.totalScore / stats.totalAttempts).toFixed(2)) : 0;
    const avgAcc = stats.totalQuestions > 0 ? Math.round((stats.totalScore / stats.totalQuestions) * 100) : 0;
    const avgTime = stats.totalAttempts > 0 ? Math.round(stats.totalTime / stats.totalAttempts) : 0;

    return {
      boothNumber: boothNum,
      boothTitle: BOOTH_TITLES[boothNum] || `Booth ${boothNum}`,
      totalAttempts: stats.totalAttempts,
      averageScore: avgScore,
      averageAccuracy: avgAcc,
      averageTimeSeconds: avgTime,
    };
  });

  // 2. Aggregate per participant (leaderboard & prize winners)
  const leaderboardRaw = participants.map((p) => {
    const completedCount = Number(p.totalTestsAppeared) || Number(p.completedCount) || (p.boothsCompleted ? Object.keys(p.boothsCompleted).length : 0);
    const score = Number(p.totalScore) || 0;
    const questions = Number(p.totalQuestions) || (completedCount * 5);
    const acc = questions > 0 ? Math.round((score / questions) * 100) : 0;
    const isWinner = Boolean(p.isWinner) || completedCount >= 4;

    if (isWinner) prizeEligibleCount++;

    return {
      entId: p.entId || p.id || 'N/A',
      name: p.name || 'Anonymous Attendee',
      lob: p.lob || 'General',
      totalScore: score,
      totalQuestions: questions,
      overallAccuracy: acc,
      totalTestsAppeared: completedCount,
      isPrizeEligible: isWinner,
      lastUpdated: p.lastUpdated || new Date().toISOString(),
    };
  });

  // Sort leaderboard: tests completed DESC, score DESC, accuracy DESC
  leaderboardRaw.sort((a, b) => {
    if (b.totalTestsAppeared !== a.totalTestsAppeared) {
      return b.totalTestsAppeared - a.totalTestsAppeared;
    }
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return b.overallAccuracy - a.overallAccuracy;
  });

  const leaderboard = leaderboardRaw.map((entry, idx) => ({
    rank: idx + 1,
    ...entry,
  }));

  const prizeEligibleWinners = leaderboard
    .filter((entry) => entry.isPrizeEligible)
    .map((entry, idx) => ({
      rank: idx + 1,
      entId: entry.entId,
      name: entry.name,
      lob: entry.lob,
      totalScore: entry.totalScore,
      overallAccuracy: entry.overallAccuracy,
      totalTestsAppeared: entry.totalTestsAppeared,
    }));

  // 3. Aggregate by Line of Business (LOB)
  const lobMap = new Map<string, { count: number; totalScore: number; winners: number }>();

  for (const entry of leaderboardRaw) {
    const lobName = entry.lob || 'Other';
    const stats = lobMap.get(lobName) || { count: 0, totalScore: 0, winners: 0 };
    stats.count += 1;
    stats.totalScore += entry.totalScore;
    if (entry.isPrizeEligible) stats.winners += 1;
    lobMap.set(lobName, stats);
  }

  const lobBreakdown = Array.from(lobMap.entries())
    .map(([lobName, stats]) => ({
      lob: lobName,
      participantCount: stats.count,
      averageScore: stats.count > 0 ? Number((stats.totalScore / stats.count).toFixed(1)) : 0,
      prizeEligibleCount: stats.winners,
    }))
    .sort((a, b) => b.participantCount - a.participantCount);

  const globalAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalScoreAwarded / totalQuestionsAnswered) * 100)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    summitName: 'Wells Fargo Technology Summit 2026',
    targetRepo: repo,
    stats: {
      totalRegisteredParticipants: totalRegistered,
      totalSubmissionsRecorded: totalSubmissions,
      totalPrizeEligibleAttendees: prizeEligibleCount,
      summitAverageAccuracy: globalAccuracy,
      totalScoreAwarded,
      totalQuestionsAnswered,
    },
    boothBreakdown,
    lobBreakdown,
    leaderboard,
    prizeEligibleWinners,
    participants,
  };
}

/**
 * Helper to push a single file to GitHub via GitHub Contents REST API
 */
async function pushSingleFileToGitHub(
  repo: string,
  filePath: string,
  content: string,
  token: string,
  commitMsg: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  let existingSha: string | undefined;

  try {
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (getRes.ok) {
      const fileInfo = await getRes.json();
      existingSha = fileInfo.sha;
    }
  } catch {
    // New file, ignore
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMsg,
      content: toBase64Utf8(content),
      sha: existingSha,
    }),
  });

  if (putRes.ok) {
    const res = await putRes.json();
    return {
      success: true,
      url: res?.commit?.html_url || `https://github.com/${repo}/blob/main/${filePath}`,
    };
  } else {
    const err = await putRes.json().catch(() => ({}));
    return {
      success: false,
      error: `(${putRes.status}): ${err.message || 'Commit failed'}`,
    };
  }
}

/**
 * Queries Firebase Firestore, compiles the Summit Dashboard JSON AND interactive Dashboard HTML,
 * and pushes both to GitHub repository (TECH_SUMMIT_RESULT).
 */
export async function syncDashboardToGitHub(): Promise<{
  success: boolean;
  message: string;
  data?: DashboardSummary;
  commitUrl?: string;
  htmlUrl?: string;
  pagesUrl?: string;
  htmlContent?: string;
}> {
  const token = (import.meta as any).env?.VITE_GITHUB_TOKEN;
  const repo = (import.meta as any).env?.VITE_GITHUB_RESULT_REPO || 'krishnakumarsabbu-prog/TECH_SUMMIT_RESULT';

  if (!token) {
    return {
      success: false,
      message: 'GitHub Personal Access Token is missing in .env (VITE_GITHUB_TOKEN).',
    };
  }

  try {
    // 1. Build the full Dashboard JSON from Firestore
    const dashboardData = await buildDashboardData();
    const jsonContent = JSON.stringify(dashboardData, null, 2);

    // 2. Generate the self-contained Executive Dashboard HTML
    const htmlContent = generateDashboardHtml(dashboardData);

    const timestampStr = new Date().toLocaleTimeString();
    const commitMsg = `[Admin Sync] Summit Dashboard: ${dashboardData.stats.totalRegisteredParticipants} attendees, ${dashboardData.stats.totalSubmissionsRecorded} submissions (${timestampStr})`;

    // 3. Push JSON to dashboard/summit_dashboard.json
    const jsonPush = await pushSingleFileToGitHub(
      repo,
      'dashboard/summit_dashboard.json',
      jsonContent,
      token,
      commitMsg
    );

    if (!jsonPush.success) {
      return {
        success: false,
        message: `Failed to push JSON to GitHub: ${jsonPush.error}`,
      };
    }

    // 4. Push HTML to dashboard/index.html
    const htmlPush = await pushSingleFileToGitHub(
      repo,
      'dashboard/index.html',
      htmlContent,
      token,
      commitMsg
    );

    // 5. Also push HTML to root index.html so GitHub Pages / root URL serves it directly!
    await pushSingleFileToGitHub(
      repo,
      'index.html',
      htmlContent,
      token,
      commitMsg
    );

    const owner = repo.split('/')[0];
    const repoName = repo.split('/')[1];
    const pagesUrl = `https://${owner}.github.io/${repoName}/`;

    return {
      success: true,
      message: `Successfully generated Dashboard JSON & HTML and pushed to ${repo}!`,
      data: dashboardData,
      commitUrl: jsonPush.url,
      htmlUrl: htmlPush.url,
      pagesUrl,
      htmlContent,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to sync dashboard to GitHub: ${err.message}`,
    };
  }
}

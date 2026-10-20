import { fetchAllParticipants, fetchAllSubmissions } from './firebaseService';

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

  participants.forEach((p) => {
    totalScoreAwarded += p.totalScore || 0;
    totalQuestionsAnswered += p.totalQuestions || 0;
    if (p.isPrizeEligible || (p.totalTestsAppeared || 0) >= 4) {
      prizeEligibleCount += 1;
    }
  });

  const activeParticipants = participants.filter((p) => (p.totalTestsAppeared || 0) > 0);
  const avgAccuracy =
    activeParticipants.length > 0
      ? Math.round(
          activeParticipants.reduce((sum, p) => sum + (p.overallAccuracy || 0), 0) /
            activeParticipants.length
        )
      : 0;

  // 1. Booth breakdown (1 to 9)
  const boothBreakdown = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((boothNum) => {
    const boothSubs = submissions.filter(
      (s) => s.booth?.boothNumber === boothNum || s.booth?.boothId === `booth-${boothNum}`
    );
    const count = boothSubs.length;
    const avgScore =
      count > 0
        ? +(boothSubs.reduce((acc, s) => acc + (s.quiz?.score || 0), 0) / count).toFixed(1)
        : 0;
    const avgPct =
      count > 0
        ? Math.round(boothSubs.reduce((acc, s) => acc + (s.quiz?.percentage || 0), 0) / count)
        : 0;
    const avgTime =
      count > 0
        ? Math.round(boothSubs.reduce((acc, s) => acc + (s.quiz?.timeTakenSeconds || 0), 0) / count)
        : 0;

    return {
      boothNumber: boothNum,
      boothTitle: BOOTH_TITLES[boothNum] || `Booth ${boothNum}`,
      totalAttempts: count,
      averageScore: avgScore,
      averageAccuracy: avgPct,
      averageTimeSeconds: avgTime,
    };
  });

  // 2. LOB breakdown
  const lobMap: Record<string, { participants: any[] }> = {};
  participants.forEach((p) => {
    const lob = p.lob || 'Other';
    if (!lobMap[lob]) lobMap[lob] = { participants: [] };
    lobMap[lob].participants.push(p);
  });

  const lobBreakdown = Object.entries(lobMap).map(([lob, data]) => {
    const pCount = data.participants.length;
    const avgScore =
      pCount > 0
        ? +(data.participants.reduce((sum, p) => sum + (p.totalScore || 0), 0) / pCount).toFixed(1)
        : 0;
    const prizeCount = data.participants.filter(
      (p) => p.isPrizeEligible || (p.totalTestsAppeared || 0) >= 4
    ).length;

    return {
      lob,
      participantCount: pCount,
      averageScore: avgScore,
      prizeEligibleCount: prizeCount,
    };
  });

  // 3. Leaderboard (sorted by totalScore DESC, accuracy DESC, tests DESC)
  const sortedParticipants = [...participants].sort((a, b) => {
    if ((b.totalScore || 0) !== (a.totalScore || 0)) {
      return (b.totalScore || 0) - (a.totalScore || 0);
    }
    if ((b.overallAccuracy || 0) !== (a.overallAccuracy || 0)) {
      return (b.overallAccuracy || 0) - (a.overallAccuracy || 0);
    }
    return (b.totalTestsAppeared || 0) - (a.totalTestsAppeared || 0);
  });

  const leaderboard = sortedParticipants.map((p, idx) => ({
    rank: idx + 1,
    entId: p.entId,
    name: p.name,
    lob: p.lob || 'N/A',
    totalScore: p.totalScore || 0,
    totalQuestions: p.totalQuestions || 0,
    overallAccuracy: p.overallAccuracy || 0,
    totalTestsAppeared: p.totalTestsAppeared || 0,
    isPrizeEligible: Boolean(p.isPrizeEligible || (p.totalTestsAppeared || 0) >= 4),
    lastUpdated: p.lastUpdated || p.registeredAt || new Date().toISOString(),
  }));

  // 4. Prize-eligible winners list
  const prizeEligibleWinners = leaderboard
    .filter((p) => p.isPrizeEligible)
    .map((p, idx) => ({
      rank: idx + 1,
      entId: p.entId,
      name: p.name,
      lob: p.lob,
      totalScore: p.totalScore,
      overallAccuracy: p.overallAccuracy,
      totalTestsAppeared: p.totalTestsAppeared,
    }));

  return {
    generatedAt: new Date().toISOString(),
    summitName: 'Technology Summit 2026 — The 60-Second Tech Challenge',
    targetRepo: repo,
    stats: {
      totalRegisteredParticipants: totalRegistered,
      totalSubmissionsRecorded: totalSubmissions,
      totalPrizeEligibleAttendees: prizeEligibleCount,
      summitAverageAccuracy: avgAccuracy,
      totalScoreAwarded: totalScoreAwarded,
      totalQuestionsAnswered: totalQuestionsAnswered,
    },
    boothBreakdown,
    lobBreakdown,
    leaderboard,
    prizeEligibleWinners,
    participants,
  };
}

/**
 * Pushes the complete Dashboard Summary JSON to TECH_SUMMIT_RESULT GitHub repository
 */
export async function syncDashboardToGitHub(): Promise<{
  success: boolean;
  message: string;
  data?: DashboardSummary;
  commitUrl?: string;
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

    const filePath = 'dashboard/summit_dashboard.json';
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    // 2. Fetch existing SHA if file already exists
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
      // New file
    }

    // 3. Commit the file via GitHub REST API (1 single clean commit!)
    const commitMsg = `[Admin Sync] Summit Dashboard: ${dashboardData.stats.totalRegisteredParticipants} attendees, ${dashboardData.stats.totalSubmissionsRecorded} submissions (${new Date().toLocaleTimeString()})`;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMsg,
        content: toBase64Utf8(jsonContent),
        sha: existingSha,
      }),
    });

    if (putRes.ok) {
      const result = await putRes.json();
      return {
        success: true,
        message: `Successfully generated dashboard JSON and pushed to ${repo} (${filePath})!`,
        data: dashboardData,
        commitUrl: result?.commit?.html_url || `https://github.com/${repo}/tree/main/${filePath}`,
      };
    } else {
      const errData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: `GitHub API error (${putRes.status}): ${errData.message || 'Commit failed'}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to sync dashboard to GitHub: ${err.message}`,
    };
  }
}

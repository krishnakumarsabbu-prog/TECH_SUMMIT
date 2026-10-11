import type { Participant, BoothResult, Submission } from '../types';

export const DEFAULT_RESULT_REPO = 'krishnakumarsabbu-prog/TECH_SUMMIT_RESULT';

export function getGitHubToken(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('technology-summit-github-token');
    if (stored && stored.trim()) return stored.trim();
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const envToken = (import.meta as any).env.VITE_GITHUB_TOKEN || (import.meta as any).env.VITE_GITHUB_RESULT_TOKEN;
    if (envToken && typeof envToken === 'string' && envToken.trim()) return envToken.trim();
  }
  return '';
}

export function saveGitHubToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('technology-summit-github-token', token.trim());
  }
}

export function getResultRepo(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('technology-summit-result-repo');
    if (stored && stored.trim()) return stored.trim();
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const envRepo = (import.meta as any).env.VITE_GITHUB_RESULT_REPO;
    if (envRepo && typeof envRepo === 'string' && envRepo.trim()) return envRepo.trim();
  }
  return DEFAULT_RESULT_REPO;
}

export function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Tests connection and permissions to the target result repository
 */
export async function testGitHubConnection(): Promise<{ success: boolean; message: string; repo?: string; permissions?: any }> {
  const token = getGitHubToken();
  const repo = getResultRepo();

  if (!token) {
    return {
      success: false,
      message: 'No GitHub token configured. Please enter a Personal Access Token with repo scope.',
      repo,
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Successfully connected to ${data.full_name}! (Push permissions: ${data.permissions?.push ? 'Yes' : 'No'})`,
        repo: data.full_name,
        permissions: data.permissions,
      };
    } else if (res.status === 401) {
      return { success: false, message: 'Authentication failed (401 Bad Credentials). Please check your token.', repo };
    } else if (res.status === 404) {
      return { success: false, message: `Repository ${repo} not found (404). Ensure token has repo access.`, repo };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: `GitHub API error (${res.status}): ${err.message || 'Unknown'}`, repo };
    }
  } catch (err: any) {
    return { success: false, message: `Network error connecting to GitHub: ${err.message}`, repo };
  }
}

/**
 * Commits a file to the GitHub result repository via GitHub REST API v3
 * Automatically handles checking existing file SHA to perform clean updates.
 */
export async function commitFileToResultRepo(
  filePath: string,
  contentStr: string,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  const token = getGitHubToken();
  const repo = getResultRepo();

  if (!token) {
    console.info(`[GitHub Result Sync] Note: No GitHub token configured. File ${filePath} was not pushed to ${repo}.`);
    return { success: false, error: 'No GitHub token configured' };
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${cleanPath}`;

  try {
    // 1. Check if the file already exists to retrieve its SHA (required by GitHub API for updates)
    let existingSha: string | undefined;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        },
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }
    } catch {
      // File does not exist yet; will create new
    }

    // 2. Commit file via PUT request
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: toBase64Utf8(contentStr),
        sha: existingSha,
      }),
    });

    if (putRes.ok) {
      console.log(`[GitHub Result Sync] ✓ Successfully committed ${cleanPath} to ${repo}`);
      return { success: true };
    } else {
      const err = await putRes.json().catch(() => ({}));
      console.warn(`[GitHub Result Sync] ⚠️ Failed to commit ${cleanPath}:`, err);
      return { success: false, error: JSON.stringify(err) };
    }
  } catch (err: any) {
    console.warn(`[GitHub Result Sync] Request error for ${cleanPath}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Pushes participant registration to results/{EntID}/registration.json
 * and initializes results/{EntID}/summary.json in the result repository.
 */
export async function pushRegistrationToResultRepo(participant: Participant): Promise<void> {
  const entId = (participant.entId || 'UNKNOWN').trim().toUpperCase();
  const now = new Date().toISOString();

  const registrationData = {
    entId,
    name: participant.name,
    lob: participant.lob || 'N/A',
    registeredAt: now,
    status: 'REGISTERED',
  };

  const regPath = `results/${entId}/registration.json`;
  const regMsg = `Register participant: ${participant.name} (${entId}) [${participant.lob || 'N/A'}]`;
  await commitFileToResultRepo(regPath, JSON.stringify(registrationData, null, 2), regMsg);

  // Initialize or maintain summary database file
  const summaryPath = `results/${entId}/summary.json`;
  const summaryData = {
    entId,
    name: participant.name,
    lob: participant.lob || 'N/A',
    registeredAt: now,
    totalTestsAppeared: 0,
    totalScore: 0,
    totalQuestions: 0,
    overallAccuracy: 0,
    isPrizeEligible: false,
    tests: [],
    lastUpdated: now,
  };
  const summaryMsg = `Initialize test database summary for ${entId}`;
  await commitFileToResultRepo(summaryPath, JSON.stringify(summaryData, null, 2), summaryMsg);
}

/**
 * Pushes completed test result to results/{EntID}/booth-{number}.json
 * and updates results/{EntID}/summary.json with aggregated statistics.
 */
export async function pushTestResultToResultRepo(
  participant: Participant,
  submission: Submission,
  allBoothResults: Record<string, BoothResult>
): Promise<void> {
  const entId = (participant.entId || 'UNKNOWN').trim().toUpperCase();
  const boothNumber = submission.booth?.boothNumber || 1;

  // 1. Push specific booth test record: results/{EntID}/booth-{number}.json
  const boothFilePath = `results/${entId}/booth-${boothNumber}.json`;
  const boothContent = JSON.stringify(submission, null, 2);
  const boothMsg = `Add Booth ${boothNumber} result for ${entId} (${participant.name} - Score: ${submission.quiz.score}/${submission.quiz.totalQuestions})`;
  await commitFileToResultRepo(boothFilePath, boothContent, boothMsg);

  // 2. Aggregate all tests for the summary database record
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
    registeredAt: (submission.participant as any)?.registeredAt || new Date().toISOString(),
    totalTestsAppeared: totalTests,
    totalScore,
    totalQuestions,
    overallAccuracy: accuracy,
    isPrizeEligible: totalTests >= 4,
    lastUpdated: new Date().toISOString(),
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

  const summaryPath = `results/${entId}/summary.json`;
  const summaryMsg = `Update test database summary for ${entId} (${totalTests} tests appeared)`;
  await commitFileToResultRepo(summaryPath, JSON.stringify(summaryData, null, 2), summaryMsg);
}

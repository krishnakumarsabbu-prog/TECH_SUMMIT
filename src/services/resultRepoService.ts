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

export function fromBase64Utf8(base64Str: string): string {
  const clean = base64Str.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
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

  // Preserve existing tests if participant already appeared for tests
  let existingTests: any[] = [];
  let existingTotalScore = 0;
  let existingTotalQuestions = 0;
  let existingAccuracy = 0;

  try {
    const existing = await fetchParticipantFromResultRepo(entId);
    if (existing.exists && existing.summary) {
      existingTests = Array.isArray(existing.summary.tests) ? existing.summary.tests : [];
      existingTotalScore = existing.summary.totalScore || 0;
      existingTotalQuestions = existing.summary.totalQuestions || 0;
      existingAccuracy = existing.summary.overallAccuracy || 0;
    }
  } catch {}

  const summaryPath = `results/${entId}/summary.json`;
  const summaryData = {
    entId,
    name: participant.name,
    lob: participant.lob || 'N/A',
    registeredAt: now,
    totalTestsAppeared: existingTests.length,
    totalScore: existingTotalScore,
    totalQuestions: existingTotalQuestions,
    overallAccuracy: existingAccuracy,
    isPrizeEligible: existingTests.length >= 4,
    tests: existingTests,
    lastUpdated: now,
  };
  const summaryMsg = existingTests.length > 0
    ? `Update participant profile for ${entId} (preserved ${existingTests.length} tests)`
    : `Initialize test database summary for ${entId}`;
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

export interface ParticipantFetchResult {
  exists: boolean;
  participant?: Participant;
  summary?: any;
  boothResults?: Record<string, BoothResult>;
  error?: string;
}

/**
 * Checks if a participant already has an existing results folder in TECH_SUMMIT_RESULT
 * (https://github.com/krishnakumarsabbu-prog/TECH_SUMMIT_RESULT/tree/main/results)
 * Directly inspects results/{EntID}/ folder, pulls registration.json, summary.json,
 * and ALL individual booth-*.json files to restore complete test records.
 */
export async function fetchParticipantFromResultRepo(entId: string): Promise<ParticipantFetchResult> {
  const cleanId = (entId || '').trim();
  if (!cleanId) return { exists: false };

  const token = getGitHubToken();
  const repo = getResultRepo();

  // Try both uppercase and lowercase folder paths (GitHub API is case-sensitive)
  const candidateFolders = [cleanId.toUpperCase(), cleanId.toLowerCase(), cleanId];
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Check GitHub result repository folder directly: results/{EntID}
  for (const folder of candidateFolders) {
    try {
      const folderUrl = `https://api.github.com/repos/${repo}/contents/results/${folder}`;
      const res = await fetch(folderUrl, { headers });

      if (res.ok) {
        const folderFiles = await res.json();
        if (Array.isArray(folderFiles) && folderFiles.length > 0) {
          console.log(`[GitHub Result Sync] Found folder results/${folder} with ${folderFiles.length} files on GitHub.`);

          let participant: Participant | null = null;
          let summary: any = null;
          const boothResults: Record<string, BoothResult> = {};

          // Process each file in the user's folder
          for (const file of folderFiles) {
            // A. Registration file
            if (file.name === 'registration.json') {
              try {
                let regContent = '';
                if (file.download_url) {
                  const rRes = await fetch(file.download_url, { headers });
                  if (rRes.ok) regContent = await rRes.text();
                } else if (file.content) {
                  regContent = fromBase64Utf8(file.content);
                }
                if (regContent) {
                  const rData = JSON.parse(regContent);
                  participant = {
                    name: rData.name || 'Participant',
                    entId: (rData.entId || cleanId).toUpperCase(),
                    lob: rData.lob || 'N/A',
                    company: 'Wells Fargo',
                    role: 'Participant',
                  };
                }
              } catch (e) {
                console.warn('[GitHub Sync] Error reading registration.json:', e);
              }
            }

            // B. Summary file
            if (file.name === 'summary.json') {
              try {
                let sContent = '';
                if (file.download_url) {
                  const sRes = await fetch(file.download_url, { headers });
                  if (sRes.ok) sContent = await sRes.text();
                } else if (file.content) {
                  sContent = fromBase64Utf8(file.content);
                }
                if (sContent) {
                  summary = JSON.parse(sContent);
                  if (!participant && summary?.name) {
                    participant = {
                      name: summary.name,
                      entId: (summary.entId || cleanId).toUpperCase(),
                      lob: summary.lob || 'N/A',
                      company: 'Wells Fargo',
                      role: 'Participant',
                    };
                  }
                  // If summary already has tests, load them
                  if (Array.isArray(summary.tests)) {
                    summary.tests.forEach((t: any) => {
                      const bNum = t.boothNumber || 1;
                      const bId = t.boothId || `booth-${bNum}`;
                      const score = t.score ?? 0;
                      const totalQuestions = t.totalQuestions ?? 5;
                      boothResults[bId] = {
                        boothId: bId,
                        boothNumber: bNum,
                        boothTitle: t.boothTitle || `Booth ${bNum}`,
                        topicTitle: t.topicTitle || 'Standard Topic',
                        topicId: t.topicId,
                        score,
                        totalQuestions,
                        percentage: t.percentage ?? (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0),
                        correctAnswers: t.correctAnswers ?? score,
                        incorrectAnswers: t.incorrectAnswers ?? Math.max(0, totalQuestions - score),
                        unansweredAnswers: t.unansweredAnswers ?? 0,
                        timeTakenSeconds: t.timeTakenSeconds ?? 0,
                        completedAt: t.completedAt || new Date().toISOString(),
                        answers: Array.isArray(t.answers) ? t.answers : [],
                      };
                    });
                  }
                }
              } catch (e) {
                console.warn('[GitHub Sync] Error reading summary.json:', e);
              }
            }

            // C. Individual booth test submissions: booth-1.json, booth-3.json, etc.
            if (/^booth-?\d+\.json$/i.test(file.name)) {
              try {
                let bContent = '';
                if (file.download_url) {
                  const bRes = await fetch(file.download_url, { headers });
                  if (bRes.ok) bContent = await bRes.text();
                } else if (file.content) {
                  bContent = fromBase64Utf8(file.content);
                }
                if (bContent) {
                  const bData = JSON.parse(bContent);
                  const boothNumber = bData.booth?.boothNumber || parseInt(file.name.match(/\d+/)?.[0] || '1', 10);
                  const boothId = bData.booth?.boothId || `booth-${boothNumber}`;

                  if (!participant && bData.participant?.name) {
                    participant = {
                      name: bData.participant.name,
                      entId: (bData.participant.entId || cleanId).toUpperCase(),
                      lob: bData.participant.lob || 'N/A',
                      company: 'Wells Fargo',
                      role: 'Participant',
                    };
                  }

                  const score = bData.quiz?.score ?? 0;
                  const totalQuestions = bData.quiz?.totalQuestions ?? 5;
                  const percentage = bData.quiz?.percentage ?? (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);

                  boothResults[boothId] = {
                    boothId,
                    boothNumber,
                    boothTitle: bData.booth?.boothTitle || `Booth ${boothNumber}`,
                    topicTitle: bData.booth?.topicTitle || 'Standard Topic',
                    topicId: bData.booth?.topicId,
                    score,
                    totalQuestions,
                    percentage,
                    correctAnswers: bData.quiz?.correctAnswers ?? score,
                    incorrectAnswers: bData.quiz?.incorrectAnswers ?? Math.max(0, totalQuestions - score),
                    unansweredAnswers: bData.quiz?.unansweredAnswers ?? 0,
                    timeTakenSeconds: bData.quiz?.timeTakenSeconds ?? 0,
                    completedAt: bData.submission?.completedAt || bData.completedAt || new Date().toISOString(),
                    answers: Array.isArray(bData.answers) ? bData.answers : [],
                  };
                }
              } catch (e) {
                console.warn(`[GitHub Sync] Error reading ${file.name}:`, e);
              }
            }
          }

          if (!participant) {
            participant = {
              name: 'Participant',
              entId: cleanId.toUpperCase(),
              lob: 'N/A',
              company: 'Wells Fargo',
              role: 'Summit Attendee',
            };
          }

          console.log(`[GitHub Result Sync] Successfully pulled records for ${cleanId.toUpperCase()}:`, {
            participant,
            testsCount: Object.keys(boothResults).length,
            booths: Object.keys(boothResults),
          });

          return {
            exists: true,
            participant,
            summary: summary || { tests: Object.values(boothResults), totalTestsAppeared: Object.keys(boothResults).length },
            boothResults,
          };
        }
      }
    } catch (err: any) {
      console.info(`[GitHub Result Sync] Folder check error for ${folder}:`, err?.message);
    }
  }

  // 2. Local backend fallback (http://localhost:3001/api/results?entId=...)
  try {
    const localRes = await fetch(`http://localhost:3001/api/results?entId=${cleanId.toUpperCase()}`);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && localData.found && (localData.summary || localData.registration)) {
        const localSummary = localData.summary || {};
        const reg = localData.registration || {};
        const participant: Participant = {
          name: localSummary.name || reg.name || 'Participant',
          entId: cleanId.toUpperCase(),
          lob: localSummary.lob || reg.lob || 'N/A',
          company: 'Wells Fargo',
          role: 'Summit Attendee',
        };

        const boothResults: Record<string, BoothResult> = {};
        if (Array.isArray(localSummary.tests)) {
          localSummary.tests.forEach((t: any) => {
            const boothId = t.boothId || `booth-${t.boothNumber}`;
            const score = t.score ?? 0;
            const totalQuestions = t.totalQuestions ?? 5;
            const correctAnswers = t.correctAnswers ?? score;
            const incorrectAnswers = t.incorrectAnswers ?? Math.max(0, totalQuestions - correctAnswers);
            const unansweredAnswers = t.unansweredAnswers ?? 0;
            const percentage = t.percentage ?? (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);

            boothResults[boothId] = {
              boothId,
              boothNumber: t.boothNumber || 1,
              boothTitle: t.boothTitle || `Booth ${t.boothNumber}`,
              topicTitle: t.topicTitle || 'Standard Topic',
              topicId: t.topicId,
              score,
              totalQuestions,
              percentage,
              correctAnswers,
              incorrectAnswers,
              unansweredAnswers,
              timeTakenSeconds: t.timeTakenSeconds ?? 0,
              completedAt: t.completedAt || new Date().toISOString(),
              answers: Array.isArray(t.answers) ? t.answers : [],
            };
          });
        }

        console.log(`[Local Result Sync] Found local records for ${cleanId.toUpperCase()}: ${Object.keys(boothResults).length} tests completed.`);
        return {
          exists: true,
          participant,
          summary: localSummary,
          boothResults,
        };
      }
    }
  } catch {
    // Local server not active
  }

  return { exists: false };
}


// Technology Summit 2026 — Local Submissions Server
// Zero external dependencies (uses standard Node.js built-in modules)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const SUBMISSIONS_DIR = path.join(__dirname, 'submissions');
const RESULTS_DIR = path.join(__dirname, 'results');

// Ensure storage directories exist
if (!fs.existsSync(SUBMISSIONS_DIR)) {
  fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });
}
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  setCors(res);

  // Handle pre-flight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Health check
  if (req.method === 'GET' && url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', event: 'Technology Summit 2026', targetRepo: 'TECH_SUMMIT_RESULT' }));
    return;
  }

  // 2. Receive and save registration -> results/<EntID>/registration.json & summary.json
  if (req.method === 'POST' && url.pathname === '/api/register') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const participant = data.participant || {};
        const entId = (participant.entId || 'UNKNOWN').trim().toUpperCase();
        const userDir = path.join(RESULTS_DIR, entId);

        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }

        const now = data.registeredAt || new Date().toISOString();
        const regFile = path.join(userDir, 'registration.json');
        const regData = {
          entId,
          name: participant.name,
          lob: participant.lob || 'N/A',
          registeredAt: now,
          status: 'REGISTERED',
        };
        fs.writeFileSync(regFile, JSON.stringify(regData, null, 2), 'utf8');

        // Initialize or preserve summary.json
        const summaryFile = path.join(userDir, 'summary.json');
        let summaryData = {
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

        if (fs.existsSync(summaryFile)) {
          try {
            const existing = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
            summaryData = { ...summaryData, ...existing, name: participant.name, lob: participant.lob || 'N/A' };
          } catch {
            // Keep default
          }
        }
        fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2), 'utf8');

        console.log(`[REGISTER] Registered user ${participant.name} (${entId}) -> results/${entId}/`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, entId, folder: `results/${entId}` }));
      } catch (err) {
        console.error('[ERROR] Registration failed:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid registration payload' }));
      }
    });
    return;
  }

  // 3. Receive and save submission JSON -> submissions/ & results/<EntID>/booth-<N>.json & summary.json
  if (req.method === 'POST' && url.pathname === '/api/submissions') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const subId = data?.submission?.submissionId || `TS_${Date.now()}`;
        const fileName = `submission_${subId}.json`;
        const filePath = path.join(SUBMISSIONS_DIR, fileName);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        // Update results/<EntID>/ database
        const entId = (data?.participant?.entId || 'UNKNOWN').trim().toUpperCase();
        const boothNumber = data?.booth?.boothNumber || 1;
        const userDir = path.join(RESULTS_DIR, entId);

        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }

        // Save booth result: results/<EntID>/booth-<number>.json
        const boothFile = path.join(userDir, `booth-${boothNumber}.json`);
        fs.writeFileSync(boothFile, JSON.stringify(data, null, 2), 'utf8');

        // Update results/<EntID>/summary.json
        const summaryFile = path.join(userDir, 'summary.json');
        let summaryData = {
          entId,
          name: data?.participant?.name || 'Unknown',
          lob: data?.participant?.lob || 'N/A',
          registeredAt: new Date().toISOString(),
          totalTestsAppeared: 0,
          totalScore: 0,
          totalQuestions: 0,
          overallAccuracy: 0,
          isPrizeEligible: false,
          tests: [],
          lastUpdated: new Date().toISOString(),
        };

        if (fs.existsSync(summaryFile)) {
          try {
            summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
          } catch {
            // Keep default
          }
        }

        // Add or update test record
        const testItem = {
          boothId: data?.booth?.boothId || `booth-${boothNumber}`,
          boothNumber: boothNumber,
          boothTitle: data?.booth?.boothTitle || `Booth ${boothNumber}`,
          topicTitle: data?.booth?.topicTitle || 'Standard Topic',
          score: data?.quiz?.score ?? 0,
          totalQuestions: data?.quiz?.totalQuestions ?? 0,
          percentage: data?.quiz?.percentage ?? 0,
          timeTakenSeconds: data?.quiz?.timeTakenSeconds ?? 0,
          completedAt: data?.submission?.completedAt || new Date().toISOString(),
        };

        const existingIdx = summaryData.tests.findIndex(t => t.boothNumber === boothNumber);
        if (existingIdx >= 0) {
          summaryData.tests[existingIdx] = testItem;
        } else {
          summaryData.tests.push(testItem);
        }

        summaryData.totalTestsAppeared = summaryData.tests.length;
        summaryData.totalScore = summaryData.tests.reduce((acc, t) => acc + (t.score || 0), 0);
        summaryData.totalQuestions = summaryData.tests.reduce((acc, t) => acc + (t.totalQuestions || 0), 0);
        summaryData.overallAccuracy = summaryData.totalQuestions > 0 ? Math.round((summaryData.totalScore / summaryData.totalQuestions) * 100) : 0;
        summaryData.isPrizeEligible = summaryData.totalTestsAppeared >= 4;
        summaryData.lastUpdated = new Date().toISOString();

        fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2), 'utf8');
        console.log(`[SAVED] Submission ${subId} for ${entId} (${data?.participant?.name}) -> booth-${boothNumber}.json`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          file: fileName,
          resultPath: `results/${entId}/booth-${boothNumber}.json`,
          totalTestsAppeared: summaryData.totalTestsAppeared
        }));
      } catch (err) {
        console.error('[ERROR] Failed to save submission:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 4. Query participant results database: GET /api/results OR GET /api/results?entId=...
  if (req.method === 'GET' && url.pathname.startsWith('/api/results')) {
    try {
      const qEntId = url.searchParams.get('entId');
      if (qEntId) {
        const userDir = path.join(RESULTS_DIR, qEntId.trim().toUpperCase());
        const summaryFile = path.join(userDir, 'summary.json');
        const regFile = path.join(userDir, 'registration.json');

        if (!fs.existsSync(userDir)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ found: false, message: `Participant ${qEntId} not found` }));
          return;
        }

        const registration = fs.existsSync(regFile) ? JSON.parse(fs.readFileSync(regFile, 'utf8')) : null;
        const summary = fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, 'utf8')) : null;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ found: true, registration, summary }));
        return;
      }

      // List all users in results database
      const userDirs = fs.existsSync(RESULTS_DIR)
        ? fs.readdirSync(RESULTS_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
        : [];

      const userSummaries = userDirs.map(uid => {
        const sPath = path.join(RESULTS_DIR, uid, 'summary.json');
        if (fs.existsSync(sPath)) {
          try {
            return JSON.parse(fs.readFileSync(sPath, 'utf8'));
          } catch {
            return { entId: uid, corrupted: true };
          }
        }
        return { entId: uid, status: 'NO_SUMMARY' };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ totalParticipants: userSummaries.length, participants: userSummaries }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 5. List all raw submissions
  if (req.method === 'GET' && url.pathname === '/api/submissions') {
    try {
      const files = fs.readdirSync(SUBMISSIONS_DIR).filter(f => f.endsWith('.json'));
      const submissions = files.map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(SUBMISSIONS_DIR, f), 'utf8'));
        } catch {
          return null;
        }
      }).filter(Boolean);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ total: submissions.length, submissions }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 4. Export all submissions as CSV
  if (req.method === 'GET' && url.pathname === '/api/export.csv') {
    try {
      const files = fs.readdirSync(SUBMISSIONS_DIR).filter(f => f.endsWith('.json'));
      const rows = [
        ['Submission ID', 'Completed At', 'Name', 'Company', 'Role', 'Email', 'Score', 'Percentage', 'Time Taken (s)'].join(',')
      ];

      files.forEach(f => {
        try {
          const s = JSON.parse(fs.readFileSync(path.join(SUBMISSIONS_DIR, f), 'utf8'));
          const row = [
            `"${s.submission?.submissionId || ''}"`,
            `"${s.submission?.completedAt || ''}"`,
            `"${s.participant?.name || ''}"`,
            `"${s.participant?.company || ''}"`,
            `"${s.participant?.role || ''}"`,
            `"${s.participant?.email || ''}"`,
            s.quiz?.score ?? '',
            s.quiz?.percentage ?? '',
            s.quiz?.timeTakenSeconds ?? ''
          ];
          rows.push(row.join(','));
        } catch {
          // ignore corrupted file
        }
      });

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="technology_summit_submissions.csv"'
      });
      res.end(rows.join('\n'));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Technology Summit 2026 Submissions & Results Server`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Submissions destination: ${SUBMISSIONS_DIR}`);
  console.log(`Results database destination: ${RESULTS_DIR}`);
  console.log(`Target GitHub repo: https://github.com/krishnakumarsabbu-prog/TECH_SUMMIT_RESULT.git`);
  console.log(`=======================================================`);
});

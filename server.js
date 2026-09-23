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

// Ensure submissions directory exists
if (!fs.existsSync(SUBMISSIONS_DIR)) {
  fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });
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
    res.end(JSON.stringify({ status: 'ok', event: 'Technology Summit 2026' }));
    return;
  }

  // 2. Receive and save submission JSON
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
        console.log(`[SAVED] New submission received: ${fileName} (${data?.participant?.name || 'Anonymous'})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, file: fileName, path: `submissions/${fileName}` }));
      } catch (err) {
        console.error('[ERROR] Failed to save submission:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 3. List all saved submissions
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
  console.log(`Technology Summit 2026 Submissions Server`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Submissions destination: ${SUBMISSIONS_DIR}`);
  console.log(`=======================================================`);
});

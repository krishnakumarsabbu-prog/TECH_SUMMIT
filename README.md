# Technology Summit 2026 — The 60-Second Tech Challenge

A QR-code-driven interactive quiz deployed as a static React application on GitHub Pages. Participants scan a QR code, enter their details, answer 5 technology questions within 60 seconds, and receive a score. Each completed attempt generates an individual JSON record for future analytics.

## Experience Flow

```
SCAN QR → ENTER DETAILS → CHECK PARTICIPATION → PLAY 5 QUESTIONS → 60-SECOND TIMER → SUBMIT → RESULT → JSON RECORD
```

## Architecture

### Current (Static GitHub Pages)

```
QR Code
   ↓
GitHub Pages (React Application)
   ↓
Participant Details
   ↓
Browser Participation ID (crypto.randomUUID + localStorage)
   ↓
Duplicate Check (localStorage)
   ↓
5 Question Quiz (randomly selected from question bank)
   ↓
60 Second Timer
   ↓
Result Calculation
   ↓
JSON Generation + Browser Download
```

### Future (Secure Backend)

```
React
   ↓
Secure Submission API
   ↓
Private GitHub Repository
   ↓
JSON Files (/submissions/*.json)
   ↓
Office Analytics Portal
```

The application includes a clean `submissionService` abstraction so the current browser-download implementation can be swapped for a secure API POST without changing the UI.

## Repository Design

### Public Application Repository (this repository)

Contains:
- `src/` — React application code
- `src/data/questions.json` — Question bank
- `.github/workflows/deploy.yml` — GitHub Actions deployment

**Never put participant PII or secrets in this public repository.**

### Private Data Repository (future: `technology-summit-data`)

Will contain:
```
technology-summit-data/
├── submissions/
│   ├── submission_TS_20260923_143522_A82F.json
│   ├── submission_TS_20260923_143610_B19C.json
│   └── ...
├── participants/
│   └── participation records
└── README.md
```

This private repository will be populated through a secure backend service, not from the browser.

## Question Management

Questions live in `src/data/questions.json`. Each question is a JSON object:

```json
{
  "id": "q001",
  "category": "Artificial Intelligence",
  "difficulty": "medium",
  "question": "Which technique allows...?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0
}
```

- To add a question: add another JSON object to the array.
- To change a question: edit the existing object.
- The application automatically loads the question bank on startup.
- Exactly 5 questions are randomly selected for each attempt.
- Answer options are shuffled per attempt, and the correct answer index is updated accordingly.

## Participant Identity & Duplicate Detection

### Browser Participation ID

- Generated using `crypto.randomUUID()` and stored in `localStorage` under `technology-summit-device-id`.
- Persists across page refreshes.

### Participation Key

- `SHA-256(normalizedName | normalizedCompany | deviceId)`
- Used as an event-level duplicate detection mechanism.

### Duplicate Detection Limitation

Because the application is fully static (no backend), a participant can technically bypass browser-only duplicate detection by:
- Clearing browser storage
- Using private/incognito mode
- Changing browser
- Changing device

This is a practical event-level duplicate mechanism, **not** secure identity authentication. The future architecture will implement server-side participant checks via a secure API.

## JSON Record Schema

Each completed attempt produces a file named `submission_TS_YYYYMMDD_HHMMSS_XXXX.json`:

```json
{
  "schemaVersion": "1.0",
  "event": {
    "eventId": "TECHSUMMIT_2026",
    "eventName": "Technology Summit"
  },
  "submission": {
    "submissionId": "TS_20260923_143522_A82F",
    "completedAt": "2026-09-23T09:42:12.000Z"
  },
  "participant": {
    "name": "John Kumar",
    "company": "ABC Technologies",
    "role": "Solution Architect",
    "email": "john@example.com"
  },
  "participation": {
    "deviceId": "uuid",
    "participationKey": "sha256-hash",
    "attemptNumber": 1
  },
  "device": {
    "deviceId": "uuid",
    "platform": "Android",
    "language": "en-IN",
    "timezone": "Asia/Kolkata",
    "screenWidth": 412,
    "screenHeight": 915,
    "devicePixelRatio": 2.625,
    "touchSupport": true
  },
  "quiz": {
    "totalQuestions": 5,
    "score": 4,
    "percentage": 80,
    "correctAnswers": 4,
    "incorrectAnswers": 1,
    "unansweredAnswers": 0,
    "timeTakenSeconds": 43
  },
  "answers": [
    {
      "questionId": "q001",
      "selectedAnswer": "Attention mechanism",
      "correct": true
    }
  ]
}
```

### Field Reference

| Field | Description |
|---|---|
| `schemaVersion` | JSON schema version for future compatibility |
| `event.eventId` | Event identifier (`TECHSUMMIT_2026`) |
| `submission.submissionId` | Unique submission ID (`TS_YYYYMMDD_HHMMSS_RAND`) |
| `submission.completedAt` | ISO 8601 UTC timestamp |
| `participant.name` | Participant full name |
| `participant.company` | Company or organization |
| `participant.role` | Job title (optional) |
| `participant.email` | Email (optional) |
| `participation.deviceId` | Browser-generated UUID |
| `participation.participationKey` | SHA-256 hash for deduplication |
| `participation.attemptNumber` | Attempt number (always 1 in current implementation) |
| `device.*` | Non-invasive browser metadata |
| `quiz.*` | Score, percentage, counts, and time |
| `answers[]` | Per-question selected answer and correctness |

## GitHub Pages Deployment

### Step 1 — Create Repository

Create a GitHub repository, e.g. `technology-summit`.

### Step 2 — Update Vite Base Path

Open `vite.config.ts` and set `base` to `"/<repository-name>/"`:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/technology-summit/',
})
```

If you rename the repository, update this value to match.

### Step 3 — Push Code

Push the code to the `main` branch of your repository.

### Step 4 — Configure GitHub Pages

Go to **Repository → Settings → Pages**. Under "Build and deployment", set **Source** to **GitHub Actions**.

### Step 5 — Wait for GitHub Actions

The workflow in `.github/workflows/deploy.yml` will automatically build and deploy on every push to `main`.

### Step 6 — Open the App

Visit: `https://<github-user>.github.io/technology-summit/`

### Step 7 — Generate QR Code

Create a QR code pointing to that URL.

### Step 8 — Print QR Code

Print the QR code for the event.

## Security Rules

- **NEVER** put a GitHub Personal Access Token, GitHub App private key, or any API secret in React, Vite environment variables, public JavaScript, or GitHub Pages frontend code.
- A browser token can be extracted by users.
- The current implementation generates and downloads JSON in the browser. It does **not** commit files to GitHub.
- Future secure submission will use a backend service with proper authentication.

## Development Reset

Add `?testMode=true` to the URL to reveal a "RESET PARTICIPATION" button that clears all local test data. This is hidden in normal production mode.

## Tech Stack

- React 18
- TypeScript
- Vite
- GitHub Pages + GitHub Actions

No backend, no database, no authentication providers, no paid services.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Privacy

Your name and organization are collected for event participation. A browser-generated identifier helps prevent duplicate quiz attempts. No invasive device identifiers (IMEI, SIM, MAC address, phone number) are collected or accessed.

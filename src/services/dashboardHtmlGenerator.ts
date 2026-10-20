import type { DashboardSummary } from './dashboardSyncService';

/**
 * Generates a self-contained, interactive, executive-grade Summit Analytics Dashboard HTML.
 * Features:
 * - Embedded offline/live dataset
 * - Real-time Search & Filter by Name, EntID, LOB, and Winner Status
 * - KPI Metric Cards with Glowing Borders
 * - Interactive Tabs: Prize Winners, Full Leaderboard, 9 Booths Analytics, and LOB Distribution
 * - One-Click CSV & JSON Export
 * - Ultra-premium Wells Fargo & Summit visual styling
 */
export function generateDashboardHtml(data: DashboardSummary): string {
  const jsonStr = JSON.stringify(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Innovation Showcase 2026 — Executive Summit Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      /* Brand and Accents */
      --brand-primary: #269E9B;
      --brand-primary-light: #6DD5CF;
      --brand-primary-dark: #197E80;
      --accent-blue: #3A84A7;
      --accent-blue-light: #EBF6FA;
      --accent-gold: #B8860B;
      --accent-gold-dark: #8F5D00;
      --accent-gold-light: #FFF8E6;
      --accent-gold-border: #F3CF65;
      --logo-red: #D71E28;

      /* Surfaces (Executive Light Palette) */
      --bg-body: #F4F8FA;
      --bg-card: #FFFFFF;
      --bg-card-muted: #F8FCFD;
      --bg-card-hover: #F2FAF9;
      --border: #DFEAED;
      --border-strong: #C4D9DF;

      /* Typography */
      --text-primary: #1C3342;
      --text-secondary: #4A6372;
      --text-muted: #7E95A3;

      /* Status */
      --success: #0E8363;
      --success-bg: #E8F7F2;
      --success-border: #84DCBF;
      --warning: #B45309;
      --warning-bg: #FEF7EA;
      --warning-border: #FCD38D;

      /* Fonts */
      --font-display: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      /* Radii */
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-xl: 26px;

      /* Shadows & Elevation */
      --shadow-sm: 0 2px 8px rgba(38, 70, 83, 0.04);
      --shadow-md: 0 6px 20px rgba(38, 70, 83, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
      --shadow-lg: 0 14px 36px rgba(38, 70, 83, 0.09), 0 2px 6px rgba(0, 0, 0, 0.04);
      --transition: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-body);
      background-image:
        radial-gradient(ellipse at 12% 0%, rgba(38, 158, 155, 0.09) 0%, transparent 45%),
        radial-gradient(ellipse at 88% 12%, rgba(58, 132, 167, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(217, 198, 154, 0.12) 0%, transparent 55%),
        linear-gradient(180deg, #F8FCFD 0%, #EFF5F7 100%);
      background-attachment: fixed;
      color: var(--text-primary);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 60px;
    }

    /* Container */
    .container {
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px 24px;
    }

    /* Executive Top Bar */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 28px;
      background: var(--bg-card);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-accent-bar {
      width: 5px;
      height: 48px;
      background: linear-gradient(180deg, var(--logo-red) 0%, #E6A217 100%);
      border-radius: 4px;
      box-shadow: 0 0 10px rgba(215, 30, 40, 0.3);
    }

    .brand-copy {
      display: flex;
      flex-direction: column;
    }

    .brand-logo-text {
      color: var(--logo-red);
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2.8px;
      line-height: 1;
    }

    .summit-title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .summit-title span {
      background: linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .sync-timestamp-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      background: #E8F6F6;
      border: 1px solid #BCE5E3;
      font-size: 12.5px;
      color: #157375;
      font-family: var(--font-mono);
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px rgba(14, 131, 99, 0.6);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-sm);
      font-family: var(--font-display);
      font-size: 13.5px;
      font-weight: 750;
      letter-spacing: 0.3px;
      cursor: pointer;
      transition: all var(--transition);
      text-decoration: none;
      border: none;
      outline: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(38, 158, 155, 0.28);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(38, 158, 155, 0.42);
    }

    .btn-outline {
      background: #FFFFFF;
      border: 1.5px solid var(--border-strong);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }

    .btn-outline:hover {
      background: #EDF7F9;
      border-color: var(--brand-primary);
      color: var(--brand-primary-dark);
      transform: translateY(-1px);
    }

    /* KPI Summary Cards Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 18px;
      margin-bottom: 28px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all var(--transition);
      box-shadow: var(--shadow-md);
    }

    .kpi-card:hover {
      border-color: var(--brand-primary);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .kpi-card--gold {
      border-color: var(--accent-gold-border);
      background: linear-gradient(145deg, #FFFFFF 0%, #FFFDF5 100%);
    }

    .kpi-card--gold:hover {
      border-color: var(--accent-gold);
      box-shadow: 0 12px 30px rgba(217, 163, 24, 0.16);
    }

    .kpi-icon {
      font-size: 32px;
      line-height: 1;
      padding: 10px;
      border-radius: var(--radius-md);
      background: #F4F9FB;
      border: 1px solid var(--border);
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .kpi-value {
      font-family: var(--font-display);
      font-size: 34px;
      font-weight: 900;
      color: #162E3D;
      line-height: 1.1;
    }

    .kpi-card--gold .kpi-value {
      color: var(--accent-gold-dark);
    }

    .kpi-sub {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Filter Bar */
    .filter-section {
      background: var(--bg-card);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px 24px;
      margin-bottom: 26px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: space-between;
      box-shadow: var(--shadow-md);
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      flex: 1;
    }

    .search-input-wrap {
      position: relative;
      min-width: 280px;
      flex: 1;
    }

    .search-input-wrap input {
      width: 100%;
      background: #F7FBFC;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px 10px 38px;
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 14px;
      outline: none;
      transition: all var(--transition);
    }

    .search-input-wrap input:focus {
      background: #FFFFFF;
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(38, 158, 155, 0.18);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 15px;
      pointer-events: none;
    }

    .filter-select {
      background: #F7FBFC;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 13.5px;
      cursor: pointer;
      outline: none;
      min-width: 180px;
      transition: all var(--transition);
    }

    .filter-select:focus {
      background: #FFFFFF;
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(38, 158, 155, 0.18);
    }

    .filter-stats-count {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .filter-stats-count strong {
      color: var(--brand-primary-dark);
      font-weight: 800;
    }

    /* Tabs Bar */
    .tabs-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 22px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 12px;
      overflow-x: auto;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: transparent;
      border: 1.5px solid transparent;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-family: var(--font-display);
      font-size: 14.5px;
      font-weight: 750;
      letter-spacing: 0.3px;
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--text-primary);
      background: #EDF7F9;
    }

    .tab-btn.active {
      color: #FFFFFF;
      background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
      box-shadow: 0 4px 14px rgba(38, 158, 155, 0.28);
    }

    .tab-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      font-family: var(--font-mono);
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-secondary);
    }

    .tab-btn.active .tab-badge {
      background: rgba(255, 255, 255, 0.25);
      color: #FFFFFF;
    }

    /* Tab Content Areas */
    .tab-panel {
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .tab-panel.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Data Table Card */
    .table-card {
      background: var(--bg-card);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .table-header-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: #FAFDFE;
      border-bottom: 1.5px solid var(--border);
      flex-wrap: wrap;
      gap: 12px;
    }

    .table-title {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .table-wrap {
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: 14px 20px;
      background: #F0F6F8;
      font-family: var(--font-display);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #3E5A6B;
      border-bottom: 1.5px solid var(--border);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }

    th:hover {
      color: var(--brand-primary-dark);
      background: #E8F2F5;
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid #EEF4F6;
      font-size: 14px;
      color: var(--text-primary);
      vertical-align: middle;
    }

    tr:hover td {
      background: var(--bg-card-hover);
    }

    .rank-cell {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 900;
      width: 60px;
    }

    .rank-1 { color: #8F5D00; font-weight: 900; }
    .rank-2 { color: #475569; font-weight: 900; }
    .rank-3 { color: #9C4A1A; font-weight: 900; }

    .entid-badge {
      font-family: var(--font-mono);
      font-size: 12.5px;
      font-weight: 700;
      color: #157375;
      background: #EDF8F8;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #B8E4E2;
    }

    .name-strong {
      font-weight: 750;
      color: #162E3D;
    }

    .lob-pill {
      display: inline-block;
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 999px;
      background: #F2F7F9;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-bar-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 140px;
    }

    .mini-track {
      flex: 1;
      height: 8px;
      background: #E4EFF2;
      border-radius: 999px;
      overflow: hidden;
    }

    .mini-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #6DD5CF 0%, #269E9B 100%);
    }

    .mini-fill--gold {
      background: linear-gradient(90deg, #F59E0B 0%, #C59310 100%);
    }

    .status-badge-winner {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--success-bg);
      border: 1px solid var(--success-border);
      color: var(--success);
      font-family: var(--font-display);
      font-size: 11.5px;
      font-weight: 800;
    }

    .status-badge-progress {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--warning-bg);
      border: 1px solid var(--warning-border);
      color: var(--warning);
      font-size: 11.5px;
      font-weight: 700;
    }

    /* 9 Booths Cards Grid */
    .booths-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .booth-card {
      background: var(--bg-card);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all var(--transition);
      box-shadow: var(--shadow-md);
    }

    .booth-card:hover {
      border-color: var(--brand-primary);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .booth-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .booth-num-pill {
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #EDF8F8;
      border: 1px solid #B8E4E2;
      color: #157375;
    }

    .booth-card-title {
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 16px;
      line-height: 1.25;
    }

    .booth-metric-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      background: #F7FBFC;
      padding: 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      text-align: center;
      margin-bottom: 14px;
    }

    .booth-metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .booth-metric-label {
      font-size: 10px;
      font-weight: 750;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .booth-metric-val {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 800;
      color: #162E3D;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    /* Footer */
    .dashboard-footer {
      margin-top: 48px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      padding-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Top Executive Header -->
    <header class="top-header">
      <div class="brand-group">
        <div class="brand-accent-bar" aria-hidden="true"></div>
        <div class="brand-copy">
          <span class="brand-logo-text">WELLSFARGO</span>
          <h1 class="summit-title">Innovation Showcase <span>2026</span> • Analytics Dashboard</h1>
        </div>
      </div>

      <div class="header-actions">
        <div class="sync-timestamp-badge">
          <span class="pulse-dot"></span>
          <span>Last Synced: <strong id="lastSyncedTime">${new Date(data.generatedAt).toLocaleTimeString()}</strong></span>
        </div>
        <button class="btn btn-outline" onclick="downloadJSON()">💾 Export JSON</button>
        <button class="btn btn-primary" onclick="exportWinnersCSV()">📥 Export Winners CSV</button>
      </div>
    </header>

    <!-- KPI Summary Grid -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-icon">👥</span>
        <div class="kpi-content">
          <span class="kpi-label">Registered Attendees</span>
          <span class="kpi-value" id="kpi-attendees">${data.stats.totalRegisteredParticipants}</span>
          <span class="kpi-sub">Across Bengaluru, Hyd & Virtual</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-icon">⚡</span>
        <div class="kpi-content">
          <span class="kpi-label">Quiz Submissions</span>
          <span class="kpi-value" id="kpi-submissions">${data.stats.totalSubmissionsRecorded}</span>
          <span class="kpi-sub">Individual booth attempts</span>
        </div>
      </div>

      <div class="kpi-card kpi-card--gold">
        <span class="kpi-icon">🏆</span>
        <div class="kpi-content">
          <span class="kpi-label">Prize-Eligible Winners</span>
          <span class="kpi-value" id="kpi-winners">${data.stats.totalPrizeEligibleAttendees}</span>
          <span class="kpi-sub">Completed ≥ 4 Booths</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-icon">🎯</span>
        <div class="kpi-content">
          <span class="kpi-label">Global Accuracy</span>
          <span class="kpi-value" id="kpi-accuracy">${data.stats.summitAverageAccuracy}%</span>
          <span class="kpi-sub">Average across all quizzes</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-icon">🎪</span>
        <div class="kpi-content">
          <span class="kpi-label">Active Booths</span>
          <span class="kpi-value">9 / 9</span>
          <span class="kpi-sub">All technology tracks live</span>
        </div>
      </div>
    </section>

    <!-- Interactive Filter & Search Bar -->
    <section class="filter-section">
      <div class="filter-controls">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" placeholder="Search by Attendee Name or EntID..." oninput="handleFilterChange()">
        </div>

        <select id="lobFilter" class="filter-select" onchange="handleFilterChange()">
          <option value="ALL">All Lines of Business (LOB)</option>
        </select>

        <select id="statusFilter" class="filter-select" onchange="handleFilterChange()">
          <option value="ALL">All Attendees</option>
          <option value="WINNERS">🏆 Prize Winners Only (≥ 4 Booths)</option>
          <option value="IN_PROGRESS">🎯 In Progress (&lt; 4 Booths)</option>
        </select>

        <button class="btn btn-outline" onclick="resetFilters()">Reset</button>
      </div>

      <div class="filter-stats-count">
        Showing <strong id="matchedCount">0</strong> attendees
      </div>
    </section>

    <!-- Tabs Navigation -->
    <nav class="tabs-nav">
      <button class="tab-btn active" onclick="switchTab('winners')">
        🏆 Prize Winners <span class="tab-badge" id="winnersTabBadge">${data.prizeEligibleWinners.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('leaderboard')">
        📊 Leaderboard <span class="tab-badge" id="leaderboardTabBadge">${data.leaderboard.length}</span>
      </button>
      <button class="tab-btn" onclick="switchTab('booths')">
        🎪 9 Booths Analytics <span class="tab-badge">9</span>
      </button>
      <button class="tab-btn" onclick="switchTab('lob')">
        🏢 LOB Breakdown <span class="tab-badge">${data.lobBreakdown.length}</span>
      </button>
    </nav>

    <!-- Tab 1: Prize Winners -->
    <div id="panel-winners" class="tab-panel active">
      <div class="table-card">
        <div class="table-header-strip">
          <div class="table-title">Official Prize-Eligible Attendees (Completed ≥ 4 Booths)</div>
          <button class="btn btn-outline" onclick="exportWinnersCSV()">📥 Download Winners CSV</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th onclick="sortTable('winners', 'rank')">Rank ↕</th>
                <th onclick="sortTable('winners', 'entId')">EntID ↕</th>
                <th onclick="sortTable('winners', 'name')">Attendee Name ↕</th>
                <th onclick="sortTable('winners', 'lob')">Line of Business ↕</th>
                <th onclick="sortTable('winners', 'booths')">Booths Completed ↕</th>
                <th onclick="sortTable('winners', 'score')">Total Score ↕</th>
                <th onclick="sortTable('winners', 'accuracy')">Accuracy ↕</th>
                <th>Prize Status</th>
              </tr>
            </thead>
            <tbody id="winnersTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 2: Full Leaderboard -->
    <div id="panel-leaderboard" class="tab-panel">
      <div class="table-card">
        <div class="table-header-strip">
          <div class="table-title">Summit Live Leaderboard & Attendance Register</div>
          <button class="btn btn-outline" onclick="exportLeaderboardCSV()">📥 Download Full CSV</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th onclick="sortTable('leaderboard', 'rank')">Rank ↕</th>
                <th onclick="sortTable('leaderboard', 'entId')">EntID ↕</th>
                <th onclick="sortTable('leaderboard', 'name')">Attendee Name ↕</th>
                <th onclick="sortTable('leaderboard', 'lob')">Line of Business ↕</th>
                <th onclick="sortTable('leaderboard', 'booths')">Booths Played ↕</th>
                <th onclick="sortTable('leaderboard', 'score')">Score ↕</th>
                <th onclick="sortTable('leaderboard', 'accuracy')">Accuracy ↕</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="leaderboardTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 3: 9 Booths Analytics -->
    <div id="panel-booths" class="tab-panel">
      <div class="booths-grid" id="boothsGrid"></div>
    </div>

    <!-- Tab 4: LOB Breakdown -->
    <div id="panel-lob" class="tab-panel">
      <div class="table-card">
        <div class="table-header-strip">
          <div class="table-title">Line of Business (LOB) Participation Breakdown</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Line of Business</th>
                <th>Total Attendees</th>
                <th>Prize Winners (≥4)</th>
                <th>Winner Conversion</th>
                <th>Average Score</th>
              </tr>
            </thead>
            <tbody id="lobTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="dashboard-footer">
      <p>Wells Fargo Technology Summit 2026 • Real-Time Firestore Synchronization • Target: <code>${data.targetRepo}</code></p>
    </footer>
  </div>

  <script>
    // Embedded Data injected at build/sync time
    const DASHBOARD_DATA = ${jsonStr};

    let currentTab = 'winners';
    let filteredLeaderboard = [...DASHBOARD_DATA.leaderboard];
    let filteredWinners = [...DASHBOARD_DATA.prizeEligibleWinners];

    // Populate LOB filter dropdown
    function initFilters() {
      const select = document.getElementById('lobFilter');
      const lobs = DASHBOARD_DATA.lobBreakdown.map(l => l.lob).filter(Boolean);
      lobs.forEach(lob => {
        const opt = document.createElement('option');
        opt.value = lob;
        opt.textContent = lob;
        select.appendChild(opt);
      });
    }

    function switchTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
      if (activeBtn) activeBtn.classList.add('active');

      const panel = document.getElementById('panel-' + tabId);
      if (panel) panel.classList.add('active');
    }

    function handleFilterChange() {
      const search = document.getElementById('searchInput').value.trim().toLowerCase();
      const lob = document.getElementById('lobFilter').value;
      const status = document.getElementById('statusFilter').value;

      filteredLeaderboard = DASHBOARD_DATA.leaderboard.filter(row => {
        const matchesSearch = !search ||
          (row.name && row.name.toLowerCase().includes(search)) ||
          (row.entId && row.entId.toLowerCase().includes(search));
        const matchesLob = lob === 'ALL' || row.lob === lob;
        const matchesStatus = status === 'ALL' ||
          (status === 'WINNERS' && row.isPrizeEligible) ||
          (status === 'IN_PROGRESS' && !row.isPrizeEligible);

        return matchesSearch && matchesLob && matchesStatus;
      });

      filteredWinners = filteredLeaderboard.filter(row => row.isPrizeEligible);

      document.getElementById('matchedCount').textContent = filteredLeaderboard.length;
      document.getElementById('winnersTabBadge').textContent = filteredWinners.length;
      document.getElementById('leaderboardTabBadge').textContent = filteredLeaderboard.length;

      renderTables();
    }

    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.getElementById('lobFilter').value = 'ALL';
      document.getElementById('statusFilter').value = 'ALL';
      handleFilterChange();
    }

    function renderTables() {
      renderWinnersTable();
      renderLeaderboardTable();
      renderBoothsGrid();
      renderLobTable();
    }

    function renderWinnersTable() {
      const tbody = document.getElementById('winnersTableBody');
      if (!filteredWinners.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🏆</div><p>No prize-eligible winners matched the current filter.</p></div></td></tr>';
        return;
      }

      tbody.innerHTML = filteredWinners.map((w, idx) => {
        const rank = idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        return '<tr>' +
          '<td class="rank-cell ' + rankClass + '">' + medal + '</td>' +
          '<td><span class="entid-badge">' + (w.entId || 'N/A') + '</span></td>' +
          '<td><span class="name-strong">' + (w.name || 'Anonymous') + '</span></td>' +
          '<td><span class="lob-pill" title="' + (w.lob || '') + '">' + (w.lob || 'General') + '</span></td>' +
          '<td>' +
            '<div class="progress-bar-cell">' +
              '<strong>' + w.totalTestsAppeared + ' / 9</strong>' +
              '<div class="mini-track"><div class="mini-fill mini-fill--gold" style="width: ' + ((w.totalTestsAppeared / 9) * 100) + '%"></div></div>' +
            '</div>' +
          '</td>' +
          '<td><strong>' + w.totalScore + ' pts</strong></td>' +
          '<td><strong>' + w.overallAccuracy + '%</strong></td>' +
          '<td><span class="status-badge-winner">🏆 Winner Eligible</span></td>' +
        '</tr>';
      }).join('');
    }

    function renderLeaderboardTable() {
      const tbody = document.getElementById('leaderboardTableBody');
      if (!filteredLeaderboard.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🔍</div><p>No attendees matched the current search criteria.</p></div></td></tr>';
        return;
      }

      tbody.innerHTML = filteredLeaderboard.map((row, idx) => {
        const rank = idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        return '<tr>' +
          '<td class="rank-cell ' + rankClass + '">' + medal + '</td>' +
          '<td><span class="entid-badge">' + (row.entId || 'N/A') + '</span></td>' +
          '<td><span class="name-strong">' + (row.name || 'Anonymous') + '</span></td>' +
          '<td><span class="lob-pill" title="' + (row.lob || '') + '">' + (row.lob || 'General') + '</span></td>' +
          '<td>' +
            '<div class="progress-bar-cell">' +
              '<strong>' + row.totalTestsAppeared + ' / 9</strong>' +
              '<div class="mini-track"><div class="mini-fill" style="width: ' + ((row.totalTestsAppeared / 9) * 100) + '%"></div></div>' +
            '</div>' +
          '</td>' +
          '<td><strong>' + row.totalScore + '</strong> / ' + row.totalQuestions + '</td>' +
          '<td><strong>' + row.overallAccuracy + '%</strong></td>' +
          '<td>' +
            (row.isPrizeEligible
              ? '<span class="status-badge-winner">🏆 Winner</span>'
              : '<span class="status-badge-progress">🎯 ' + row.totalTestsAppeared + '/4</span>') +
          '</td>' +
        '</tr>';
      }).join('');
    }

    function renderBoothsGrid() {
      const container = document.getElementById('boothsGrid');
      const booths = DASHBOARD_DATA.boothBreakdown || [];

      container.innerHTML = booths.map(b => {
        return '<div class="booth-card">' +
          '<div>' +
            '<div class="booth-card-header">' +
              '<span class="booth-num-pill">BOOTH #' + b.boothNumber + '</span>' +
              '<span style="font-size: 22px;">🎪</span>' +
            '</div>' +
            '<h3 class="booth-card-title">' + b.boothTitle + '</h3>' +
          '</div>' +
          '<div>' +
            '<div class="booth-metric-row">' +
              '<div class="booth-metric-item">' +
                '<span class="booth-metric-label">Attempts</span>' +
                '<span class="booth-metric-val">' + b.totalAttempts + '</span>' +
              '</div>' +
              '<div class="booth-metric-item">' +
                '<span class="booth-metric-label">Avg Score</span>' +
                '<span class="booth-metric-val">' + b.averageScore + '/5</span>' +
              '</div>' +
              '<div class="booth-metric-item">' +
                '<span class="booth-metric-label">Accuracy</span>' +
                '<span class="booth-metric-val">' + b.averageAccuracy + '%</span>' +
              '</div>' +
            '</div>' +
            '<div style="font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between;">' +
              '<span>Avg Time Taken:</span>' +
              '<strong>' + b.averageTimeSeconds + 's / quiz</strong>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function renderLobTable() {
      const tbody = document.getElementById('lobTableBody');
      const lobs = DASHBOARD_DATA.lobBreakdown || [];

      tbody.innerHTML = lobs.map(l => {
        const rate = l.participantCount > 0 ? Math.round((l.prizeEligibleCount / l.participantCount) * 100) : 0;
        return '<tr>' +
          '<td><strong>' + l.lob + '</strong></td>' +
          '<td><span class="entid-badge">' + l.participantCount + ' attendees</span></td>' +
          '<td><strong style="color: var(--accent-gold);">' + l.prizeEligibleCount + '</strong></td>' +
          '<td>' +
            '<div class="progress-bar-cell">' +
              '<span>' + rate + '%</span>' +
              '<div class="mini-track"><div class="mini-fill mini-fill--gold" style="width: ' + rate + '%"></div></div>' +
            '</div>' +
          '</td>' +
          '<td><strong>' + l.averageScore + ' pts</strong></td>' +
        '</tr>';
      }).join('');
    }

    function downloadJSON() {
      const blob = new Blob([JSON.stringify(DASHBOARD_DATA, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summit_dashboard_' + Date.now() + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportWinnersCSV() {
      const headers = ['Rank', 'EntID', 'Name', 'Line of Business', 'Booths Completed', 'Total Score', 'Accuracy (%)'];
      const rows = filteredWinners.map((w, idx) => [
        idx + 1,
        '"' + (w.entId || '') + '"',
        '"' + (w.name || '') + '"',
        '"' + (w.lob || '') + '"',
        w.totalTestsAppeared,
        w.totalScore,
        w.overallAccuracy
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summit_prize_winners_' + Date.now() + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportLeaderboardCSV() {
      const headers = ['Rank', 'EntID', 'Name', 'Line of Business', 'Booths Completed', 'Total Score', 'Total Questions', 'Accuracy (%)', 'Prize Winner'];
      const rows = filteredLeaderboard.map((r, idx) => [
        idx + 1,
        '"' + (r.entId || '') + '"',
        '"' + (r.name || '') + '"',
        '"' + (r.lob || '') + '"',
        r.totalTestsAppeared,
        r.totalScore,
        r.totalQuestions,
        r.overallAccuracy,
        r.isPrizeEligible ? 'YES' : 'NO'
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summit_leaderboard_' + Date.now() + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Initialize on page load
    initFilters();
    handleFilterChange();
  </script>
</body>
</html>
`;
}

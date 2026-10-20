import React, { useState } from 'react';
import {
  validateAdminLogin,
  syncDashboardToGitHub,
  DashboardSummary,
} from '../services/dashboardSyncService';
import { Button } from './Button';

interface AdminSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSyncModal: React.FC<AdminSyncModalProps> = ({ isOpen, onClose }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);
  const [pagesUrl, setPagesUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAdminLogin(username, password)) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid organizer username or password. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    setSyncStatus('idle');
    setStatusMessage('');
    setDashboardData(null);
    setCommitUrl(null);
    setPagesUrl(null);
    setHtmlContent(null);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('Querying Firebase Firestore, compiling analytics JSON & generating live HTML Dashboard...');

    try {
      const res = await syncDashboardToGitHub();
      if (res.success) {
        setSyncStatus('success');
        setStatusMessage(res.message);
        setDashboardData(res.data || null);
        setCommitUrl(res.commitUrl || null);
        setPagesUrl(res.pagesUrl || null);
        setHtmlContent(res.htmlContent || null);
      } else {
        setSyncStatus('error');
        setStatusMessage(res.message);
      }
    } catch (err: any) {
      setSyncStatus('error');
      setStatusMessage(err.message || 'Unexpected sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadJson = () => {
    if (!dashboardData) return;
    const blob = new Blob([JSON.stringify(dashboardData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summit_dashboard_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], {
      type: 'text/html;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summit_dashboard_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ts-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ts-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="ts-modal-header">
          <div className="ts-modal-header__brand">
            <div className="ts-modal-header__icon-badge" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div className="ts-modal-eyebrow">ORGANIZER ADMIN PORTAL</div>
              <h2 className="ts-modal-title">Summit Dashboard & HTML Sync</h2>
            </div>
          </div>
          <button
            type="button"
            className="ts-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* View 1: Organizer Authentication Form */}
        {!isLoggedIn ? (
          <div className="ts-modal-body">
            <p className="ts-modal-desc">
              Sign in with summit organizer credentials to aggregate attendee scores, compile the analytics JSON, and push the live interactive Dashboard HTML directly to GitHub.
            </p>

            <form onSubmit={handleLogin} className="ts-modal-form">
              <div className="ts-field">
                <label className="ts-field__label">
                  Admin Username
                </label>
                <div className="ts-input-with-icon">
                  <span className="ts-input-icon" aria-hidden="true">👤</span>
                  <input
                    type="text"
                    className="ts-field__input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="ts-field">
                <label className="ts-field__label">
                  Admin Password
                </label>
                <div className="ts-input-with-icon">
                  <span className="ts-input-icon" aria-hidden="true">🔑</span>
                  <input
                    type="password"
                    className="ts-field__input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter organizer password"
                    autoComplete="current-password"
                    autoFocus
                    required
                  />
                </div>
                <div className="ts-modal-hint-pill">
                  <span>💡 Summit organizer key: <strong>Summit2026!</strong></span>
                </div>
              </div>

              {loginError && (
                <div className="ts-modal-alert ts-modal-alert--error">
                  <span className="ts-alert-icon">⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <div className="ts-modal-actions">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Unlock Admin Portal 🔐
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* View 2: Sync Control Dashboard */
          <div className="ts-modal-body">
            {/* Authenticated Strip */}
            <div className="ts-modal-auth-strip">
              <div className="ts-modal-auth-user">
                <span className="ts-live-pulse-dot" aria-hidden="true" />
                <span>Authenticated as <strong>{username}</strong> (Summit Admin)</span>
              </div>
              <button
                type="button"
                className="ts-modal-logout-btn"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>

            {/* Target Destination Card */}
            <div className="ts-sync-destination-card">
              <div className="ts-sync-dest-row">
                <span className="ts-sync-dest-label">GitHub Result Repo:</span>
                <span className="ts-sync-dest-value ts-sync-dest-repo">krishnakumarsabbu-prog/TECH_SUMMIT_RESULT</span>
              </div>
              <div className="ts-sync-dest-row">
                <span className="ts-sync-dest-label">Data JSON:</span>
                <span className="ts-sync-dest-value ts-sync-dest-path">dashboard/summit_dashboard.json</span>
              </div>
              <div className="ts-sync-dest-row">
                <span className="ts-sync-dest-label">Interactive Dashboard:</span>
                <span className="ts-sync-dest-value ts-sync-dest-repo">dashboard/index.html & index.html</span>
              </div>

              <div className="ts-sync-dest-summary">
                <span className="ts-sync-summary-title">Features Generated in Sync:</span>
                <div className="ts-sync-chips">
                  <span className="ts-chip">👥 Attendee Register</span>
                  <span className="ts-chip">🏆 Prize Winners Filter</span>
                  <span className="ts-chip">🎪 9 Booths Analytics</span>
                  <span className="ts-chip">🏢 LOB Breakdown</span>
                  <span className="ts-chip">📥 CSV One-Click Export</span>
                </div>
              </div>
            </div>

            {/* Sync Status Banner */}
            {syncStatus !== 'idle' && (
              <div className={`ts-modal-alert ts-modal-alert--${syncStatus}`}>
                <div className="ts-modal-alert-header">
                  <span className="ts-alert-icon">{syncStatus === 'success' ? '✓' : '✕'}</span>
                  <strong>{syncStatus === 'success' ? 'Push to GitHub Succeeded!' : 'Sync Issue Encountered'}</strong>
                </div>
                <div className="ts-modal-alert-msg">{statusMessage}</div>

                {dashboardData && (
                  <div className="ts-sync-stats-grid">
                    <div className="ts-sync-stat-item">
                      <span className="ts-sync-stat-label">Total Attendees</span>
                      <strong className="ts-sync-stat-num">{dashboardData.stats.totalRegisteredParticipants}</strong>
                    </div>
                    <div className="ts-sync-stat-item">
                      <span className="ts-sync-stat-label">Submissions</span>
                      <strong className="ts-sync-stat-num">{dashboardData.stats.totalSubmissionsRecorded}</strong>
                    </div>
                    <div className="ts-sync-stat-item">
                      <span className="ts-sync-stat-label">Prize Eligible</span>
                      <strong className="ts-sync-stat-num">{dashboardData.stats.totalPrizeEligibleAttendees}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="ts-modal-actions">
              {dashboardData && (
                <Button variant="ghost" onClick={handleDownloadJson}>
                  💾 Download JSON
                </Button>
              )}
              {htmlContent && (
                <Button variant="ghost" onClick={handleDownloadHtml}>
                  🌐 Download HTML Dashboard
                </Button>
              )}
              {pagesUrl && (
                <a
                  href={pagesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ts-view-github-link"
                  style={{ background: 'rgba(38, 158, 155, 0.15)', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary-dark)' }}
                >
                  📊 Open Live Dashboard ↗
                </a>
              )}
              {commitUrl && (
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ts-view-github-link"
                >
                  ↗ View on GitHub
                </a>
              )}
              <Button
                variant="primary"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? '⚡ Compiling & Pushing...' : '⚡ SYNC TO GITHUB REPO'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

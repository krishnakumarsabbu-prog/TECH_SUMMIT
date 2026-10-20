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

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAdminLogin(username, password)) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid admin username or password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    setSyncStatus('idle');
    setStatusMessage('');
    setDashboardData(null);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('Querying Firebase Firestore & generating Dashboard JSON...');

    try {
      const res = await syncDashboardToGitHub();
      if (res.success) {
        setSyncStatus('success');
        setStatusMessage(res.message);
        setDashboardData(res.data || null);
        setCommitUrl(res.commitUrl || null);
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

  const handleDownloadLocal = () => {
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

  return (
    <div className="ts-qr-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="ts-qr-modal-content"
        style={{
          maxWidth: '560px',
          textAlign: 'left',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ts-text-primary, #fff)' }}>
                Organizer Dashboard Sync
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted, #94a3b8)' }}>
                Aggregate Firebase Results $\rightarrow$ Push to TECH_SUMMIT_RESULT
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ts-text-muted, #94a3b8)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* View 1: Login Form */}
        {!isLoggedIn ? (
          <div>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--ts-text-muted, #94a3b8)',
                marginBottom: '1rem',
                lineHeight: 1.5,
              }}
            >
              Please enter organizer credentials to generate the summit dashboard JSON and push results to GitHub.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--ts-text-muted, #94a3b8)',
                    marginBottom: '0.3rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  className="ts-field__input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--ts-text-muted, #94a3b8)',
                    marginBottom: '0.3rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  className="ts-field__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                  Default summit password: <code>Summit2026!</code>
                </div>
              </div>

              {loginError && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#f87171',
                    fontSize: '0.825rem',
                  }}
                >
                  ✕ {loginError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Log In as Organizer
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* View 2: Sync Dashboard View */
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.8rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#10b981' }}>
                <span>✓</span> Authenticated as <strong>{username}</strong>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Log Out
              </button>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.825rem',
              }}
            >
              <div style={{ color: 'var(--ts-text-muted, #94a3b8)', marginBottom: '0.4rem' }}>
                <strong>Destination GitHub Repo:</strong>{' '}
                <span style={{ color: '#38bdf8' }}>krishnakumarsabbu-prog/TECH_SUMMIT_RESULT</span>
              </div>
              <div style={{ color: 'var(--ts-text-muted, #94a3b8)', marginBottom: '0.6rem' }}>
                <strong>Target File:</strong>{' '}
                <span style={{ color: '#a78bfa' }}>dashboard/summit_dashboard.json</span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                This will automatically compile:
                <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                  <li>Global attendance, submission & accuracy metrics</li>
                  <li>All 9 Booth breakdown statistics (Attempts, Avg Scores, Times)</li>
                  <li>Line of Business (LOB) participation breakdown</li>
                  <li>Live Leaderboard ranking (Top performers)</li>
                  <li>Prize-eligible winners list (completed $\ge$ 4 booths)</li>
                </ul>
              </div>
            </div>

            {/* Status Message */}
            {syncStatus !== 'idle' && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  background:
                    syncStatus === 'success'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${
                    syncStatus === 'success' ? '#22c55e' : '#ef4444'
                  }`,
                  color: syncStatus === 'success' ? '#86efac' : '#fca5a5',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {syncStatus === 'success' ? '✓ Push Successful!' : '✕ Sync Failed'}
                </div>
                <div>{statusMessage}</div>

                {dashboardData && (
                  <div
                    style={{
                      marginTop: '0.6rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '0.5rem',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      color: '#fff',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8' }}>Attendees:</span>{' '}
                      <strong>{dashboardData.stats.totalRegisteredParticipants}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Submissions:</span>{' '}
                      <strong>{dashboardData.stats.totalSubmissionsRecorded}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Prize Eligible:</span>{' '}
                      <strong>{dashboardData.stats.totalPrizeEligibleAttendees}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {dashboardData && (
                <Button variant="ghost" onClick={handleDownloadLocal}>
                  💾 Download JSON
                </Button>
              )}
              {commitUrl && (
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.55rem 0.85rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  ↗ View on GitHub
                </a>
              )}
              <Button
                variant="primary"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? 'Compiling & Pushing...' : '⚡ SYNC DASHBOARD TO GITHUB'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

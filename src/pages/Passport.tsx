import { useMemo, useState, useCallback } from 'react';
import type { Participant, BoothResult, BoothConfig } from '../types';
import { BOOTHS, MAX_BOOTHS_PER_PARTICIPANT, REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import { QRScannerModal } from '../components/QRScannerModal';
import { parseBoothFromScan, playErrorSound } from '../utils/qrHelper';
import { AlertCircleIcon } from '../components/Icons';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface PassportProps {
  participant: Participant | null;
  boothResults: Record<string, BoothResult>;
  hasReachedBoothLimit: boolean;
  onBackToCurrent?: () => void;
  hasActiveQuiz?: boolean;
  onLaunchBooth?: (booth: BoothConfig) => void;
  onOpenUrl?: (url: string) => void;
  onEditProfile?: () => void;
  onGoHome?: () => void;
}

export function Passport({
  participant,
  boothResults,
  hasReachedBoothLimit,
  onBackToCurrent,
  hasActiveQuiz,
  onLaunchBooth,
  onOpenUrl,
  onEditProfile,
  onGoHome,
}: PassportProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTargetBooth, setScanTargetBooth] = useState<BoothConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedList = useMemo(() => Object.values(boothResults), [boothResults]);
  const completedCount = completedList.length;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remainingToWin = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  // Overall statistics
  const stats = useMemo(() => {
    let totalScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    completedList.forEach((r) => {
      totalScore += r.score;
      totalQuestions += r.totalQuestions;
      totalTime += r.timeTakenSeconds;
    });

    const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const avgTime = completedCount > 0 ? Math.round(totalTime / completedCount) : 0;

    return { totalScore, totalQuestions, accuracy, avgTime, totalTime };
  }, [completedList, completedCount]);

  const progressPercentage = Math.min(100, Math.round((completedCount / REQUIRED_BOOTHS_TO_WIN) * 100));

  const handleOpenScanner = useCallback((target?: BoothConfig | null) => {
    setScanTargetBooth(target || null);
    setIsScannerOpen(true);
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const { booth, externalUrl } = parseBoothFromScan(decodedText);

    if (scanTargetBooth && booth && booth.id !== scanTargetBooth.id) {
      playErrorSound();
      setToastMessage(
        `Wrong Booth! You selected Booth ${scanTargetBooth.number} (${scanTargetBooth.title}), but scanned Booth ${booth.number} (${booth.title}). Please scan the QR code for Booth ${scanTargetBooth.number} to play.`
      );
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    setIsScannerOpen(false);

    if (booth) {
      if (onLaunchBooth) {
        onLaunchBooth(booth);
      }
    } else if (externalUrl) {
      if (onOpenUrl) {
        onOpenUrl(externalUrl);
      } else {
        window.location.href = externalUrl;
      }
    } else {
      setToastMessage(
        `Scanned: "${decodedText.length > 40 ? decodedText.slice(0, 40) + '...' : decodedText}". Not recognized as a summit booth challenge.`
      );
      setTimeout(() => setToastMessage(null), 4500);
    }
  }, [scanTargetBooth, onLaunchBooth, onOpenUrl]);

  return (
    <div className="app-screen app-screen--passport" role="main">
      {/* 1. Universal Sticky App Header with Wells Fargo Logo */}
      <AppStickyHeader
        subtitle="Summit Passport"
        rightAction={
          <button
            type="button"
            className="app-timer-badge"
            onClick={() => handleOpenScanner(null)}
            aria-label="Scan any booth QR code"
            style={{ cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
            <span>Scan QR</span>
          </button>
        }
      />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
      {/* User Profile Card */}
      <section className="app-passport-user-card" aria-label="Attendee profile">
        <div className="app-user-avatar" aria-hidden="true">
          {participant?.name ? participant.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div className="app-user-meta">
          <span className="app-user-tag">Official Summit Pass</span>
          <h1 className="app-user-name">{participant?.name || 'Summit Attendee'}</h1>
          <span className="app-user-id">{participant?.email || participant?.entId || 'Innovation Explorer'}</span>
        </div>
        <span className={`app-status-badge ${isWinner ? 'app-status-badge--winner' : 'app-status-badge--progress'}`}>
          {isWinner ? 'Prize Qualified' : `${completedCount}/${REQUIRED_BOOTHS_TO_WIN} Goal`}
        </span>
      </section>

      {/* 3. Challenge Progress & 2x2 Metric Grid (Matching Sample App "Pending Issues") */}
      <section className="app-card" aria-label="Challenge statistics">
        <div className="app-section-header">
          <div className="app-section-left">
            <span className="app-section-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <h2 className="app-section-title">Challenge Progress</h2>
          </div>
          <span className="app-section-link">
            {isWinner ? 'Target Achieved' : `${remainingToWin} needed to win`}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="app-segmented-progress" style={{ height: '8px' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '4px',
                background: 'var(--app-primary)',
                width: `${progressPercentage}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--app-text-muted)' }}>
            <span>{completedCount} of {REQUIRED_BOOTHS_TO_WIN} required (Max {MAX_BOOTHS_PER_PARTICIPANT})</span>
            <span>{progressPercentage}% Completed</span>
          </div>
        </div>

        {/* 2x2 Metric Tiles */}
        <div className="app-metrics-grid">
          <div className="app-metric-tile">
            <span className="app-metric-value">{completedCount} / {TOTAL_BOOTHS}</span>
            <span className="app-metric-label">Booths Played</span>
          </div>

          <div className="app-metric-tile">
            <span className="app-metric-value">{stats.totalScore}</span>
            <span className="app-metric-label">Points Earned</span>
          </div>

          <div className="app-metric-tile">
            <span className="app-metric-value">{stats.accuracy}%</span>
            <span className="app-metric-label">Accuracy Rate</span>
          </div>

          <div className="app-metric-tile">
            <span className="app-metric-value">{stats.avgTime}s</span>
            <span className="app-metric-label">Avg Speed / Booth</span>
          </div>
        </div>
      </section>

      {/* 4. Booth Challenges Section (Matching Sample App "Latest Complaints" list) */}
      <section className="app-card" aria-label="Available booth challenges">
        <div className="app-section-header">
          <div className="app-section-left">
            <span className="app-section-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <h2 className="app-section-title">Booth Challenges</h2>
          </div>
          <button
            type="button"
            className="app-section-link"
            onClick={() => handleOpenScanner(null)}
          >
            Scan any QR
          </button>
        </div>

        <div className="app-booth-list" role="list">
          {BOOTHS.map((booth) => {
            const res = boothResults[booth.id];
            const isCompleted = Boolean(res);

            return (
              <div
                key={booth.id}
                role="listitem"
                className={`app-booth-item ${!isCompleted && !hasReachedBoothLimit ? 'app-booth-item--clickable' : ''}`}
                onClick={() => {
                  if (!isCompleted && !hasReachedBoothLimit) {
                    handleOpenScanner(booth);
                  }
                }}
              >
                <div className="app-booth-left">
                  <div className="app-booth-number" aria-hidden="true">
                    {booth.number}
                  </div>
                  <div className="app-booth-info">
                    <span className="app-booth-name">{booth.title}</span>
                    <span className="app-booth-category">{booth.description}</span>
                  </div>
                </div>

                {isCompleted && res ? (
                  <span className="app-booth-status-pill app-booth-status-pill--done">
                    Done ({res.score}/{res.totalQuestions} pts)
                  </span>
                ) : (
                  <button
                    type="button"
                    className="app-booth-status-pill app-booth-status-pill--action"
                    disabled={hasReachedBoothLimit}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenScanner(booth);
                    }}
                  >
                    Play / Scan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Return to active quiz if applicable */}
      {hasActiveQuiz && onBackToCurrent && (
        <div style={{ width: '100%' }}>
          <button
            type="button"
            className="app-dock-btn app-dock-btn--primary"
            style={{ width: '100%' }}
            onClick={onBackToCurrent}
          >
            Return to Current Quiz
          </button>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="ts-scanner-toast ts-scanner-toast--error" role="alert">
          <span><AlertCircleIcon size={18} /></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        targetBooth={scanTargetBooth}
      />

      </div>

      {/* 5. Bottom Navigation Dock (Matching Sample Screenshot Tab Bar) */}
      <nav className="app-nav-dock" aria-label="Bottom Navigation">
        <button
          type="button"
          className="app-nav-tab"
          onClick={onGoHome}
          aria-label="Home"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>

        <button
          type="button"
          className="app-nav-tab app-nav-tab--active"
          aria-label="Passport"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <span>Passport</span>
        </button>

        <button
          type="button"
          className="app-nav-tab"
          onClick={() => handleOpenScanner(null)}
          aria-label="Scan QR Code"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
          <span>Scan QR</span>
        </button>

        <button
          type="button"
          className="app-nav-tab"
          onClick={onEditProfile}
          aria-label="Profile"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

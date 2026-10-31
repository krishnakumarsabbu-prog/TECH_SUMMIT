import type { BoothResult, QuizResult } from '../types';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import { TrophyIcon, TargetIcon } from '../components/Icons';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface AlreadyPlayedProps {
  boothResult: BoothResult | null;
  overallResult: QuizResult | null;
  completedCount: number;
  completedAt: string | null;
  onDone: () => void;
  onExploreOtherBooths?: () => void;
}

export function AlreadyPlayed({
  boothResult,
  overallResult,
  completedCount,
  completedAt,
  onDone,
  onExploreOtherBooths,
}: AlreadyPlayedProps) {
  const result = boothResult ?? overallResult;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  return (
    <div className="app-screen" role="main">
      {/* 1. Universal Sticky Top Header */}
      <AppStickyHeader
        subtitle="Challenge Status"
        rightAction={
          <span className="app-tag-pill" style={{ margin: 0 }}>
            COMPLETED
          </span>
        }
      />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
        {/* Status Card */}
        <section className="app-card" aria-label="Booth Completed Notice">
          <div className="app-card-eyebrow-row">
            <span className="app-tag-pill" style={{ background: 'var(--app-success-light)', color: 'var(--app-success)' }}>
              ATTEMPT RECORDED
            </span>
            <span className="app-category-text">LEADERBOARD PROTECTED</span>
          </div>

          <h1 className="app-card-title">
            {boothResult ? `Booth ${boothResult.boothNumber} Already Completed` : 'Challenge Already Completed'}
          </h1>

          <p className="app-card-subtitle">
            {boothResult
              ? `You have already submitted your answers for "${boothResult.boothTitle}". Each attendee is restricted to one attempt per booth to ensure summit leaderboard integrity.`
              : 'You have already recorded an attempt for this challenge.'}
          </p>

          {/* 2x2 Metric Grid */}
          {result && (
            <div className="app-metrics-grid" style={{ width: '100%', marginTop: '6px' }}>
              <div className="app-metric-tile">
                <span className="app-metric-value">{result.score} / {result.totalQuestions}</span>
                <span className="app-metric-label">Points Earned</span>
              </div>

              <div className="app-metric-tile">
                <span className="app-metric-value">{result.percentage}%</span>
                <span className="app-metric-label">Accuracy Rate</span>
              </div>

              <div className="app-metric-tile">
                <span className="app-metric-value">{result.timeTakenSeconds}s</span>
                <span className="app-metric-label">Time Taken</span>
              </div>

              <div className="app-metric-tile">
                <span className="app-metric-value" style={{ fontSize: '14px' }}>
                  {completedAt ? new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                </span>
                <span className="app-metric-label">Submission Time</span>
              </div>
            </div>
          )}

          {/* Milestone Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: isWinner ? 'var(--app-success-light)' : 'var(--app-primary-light)',
              border: `1px solid ${isWinner ? 'var(--app-success)' : 'rgba(37, 99, 235, 0.25)'}`,
              marginTop: '6px',
            }}
          >
            <div style={{ color: isWinner ? 'var(--app-success)' : 'var(--app-primary)', flexShrink: 0 }}>
              {isWinner ? <TrophyIcon size={24} /> : <TargetIcon size={24} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--app-text-primary)' }}>
                {isWinner
                  ? `Passport Status: Winner (${completedCount}/${TOTAL_BOOTHS} Booths)`
                  : `Passport Status: ${completedCount} of ${REQUIRED_BOOTHS_TO_WIN} Completed`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--app-text-secondary)', marginTop: '2px' }}>
                {isWinner
                  ? 'You have qualified for Summit Prizes! Present your Passport at the helpdesk.'
                  : `Scan and complete ${remaining} more booth${remaining > 1 ? 's' : ''} to qualify for the prize.`}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Sticky Bottom Action Dock */}
      <footer className="app-bottom-dock">
        {onExploreOtherBooths && (
          <button
            type="button"
            className="app-dock-btn app-dock-btn--secondary"
            onClick={onExploreOtherBooths}
          >
            Explore Booths
          </button>
        )}
        <button
          type="button"
          className="app-dock-btn app-dock-btn--primary"
          onClick={onDone}
          style={{ width: onExploreOtherBooths ? 'auto' : '100%' }}
        >
          View My Passport →
        </button>
      </footer>
    </div>
  );
}

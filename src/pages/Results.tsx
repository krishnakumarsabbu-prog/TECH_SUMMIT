import type { QuizResult } from '../types';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface ResultsProps {
  result: QuizResult;
  boothTitle?: string;
  boothNumber?: number;
  completedCount: number;
  onDone: () => void;
  downloadError: string | null;
}

export function Results({
  result,
  boothTitle,
  boothNumber,
  completedCount,
  onDone,
}: ResultsProps) {
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  let rankText = 'Summit Competitor';
  if (result.percentage >= 80 && result.timeTakenSeconds <= 45) {
    rankText = 'Top 5% • Master Architect';
  } else if (result.percentage >= 80) {
    rankText = 'Top 15% • Lead Engineer';
  } else if (result.percentage >= 60) {
    rankText = 'Top 35% • Senior Practitioner';
  }

  return (
    <div className="app-screen" role="main">
      {/* 1. Universal Wells Fargo Sticky Header */}
      <AppStickyHeader
        subtitle="Challenge Results"
        rightAction={
          <span className="app-tag-pill" style={{ margin: 0 }}>
            {result.score}/{result.totalQuestions} PTS
          </span>
        }
      />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
        <div className="app-card" style={{ textAlign: 'center', alignItems: 'center', padding: '24px 18px', gap: '14px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--app-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--app-primary)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>

          <span className="app-tag-pill">
            BOOTH {boothNumber || 1} • {boothTitle ? boothTitle.toUpperCase() : 'CHALLENGE COMPLETE'}
          </span>

          <h1 className="app-card-title" style={{ fontSize: '22px' }}>
            {result.score >= 3 ? 'Challenge Conquered!' : 'Challenge Completed!'}
          </h1>

          <p className="app-card-subtitle" style={{ textAlign: 'center' }}>
            {isWinner
              ? `Outstanding! You have completed ${completedCount} of ${TOTAL_BOOTHS} booths and unlocked official Summit Winner prize status!`
              : `Great effort! You have completed ${completedCount} of ${REQUIRED_BOOTHS_TO_WIN} booths (${remaining} more needed to qualify for the summit prize).`}
          </p>

          {/* 2x2 Metric Grid */}
          <div className="app-metrics-grid" style={{ width: '100%', marginTop: '6px' }}>
            <div className="app-metric-tile">
              <span className="app-metric-value">{result.score} / {result.totalQuestions}</span>
              <span className="app-metric-label">Points (1 pt/question)</span>
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
              <span className="app-metric-value" style={{ fontSize: '14px' }}>{rankText}</span>
              <span className="app-metric-label">Summit Standing</span>
            </div>
          </div>

          <div className="app-card-spacer" aria-hidden="true" />
        </div>
      </div>

      {/* 3. Bottom Sticky Action Dock */}
      <footer className="app-bottom-dock">
        <button
          type="button"
          className="app-dock-btn app-dock-btn--secondary"
          onClick={onDone}
        >
          Explore Booths
        </button>

        <button
          type="button"
          className="app-dock-btn app-dock-btn--primary"
          onClick={onDone}
        >
          View Passport →
        </button>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import type { BoothConfig, Participant } from '../types';
import { Button } from '../components/Button';
import { BOOTHS, REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';

interface WelcomeProps {
  targetBooth: BoothConfig | null;
  participant: Participant | null;
  completedCount: number;
  onStart: () => void;
  onResume: () => void;
  hasSavedQuiz: boolean;
  onOpenPassport: () => void;
  onSelectBooth?: (booth: BoothConfig) => void;
}

export function Welcome({
  targetBooth,
  participant,
  completedCount,
  onStart,
  onResume,
  hasSavedQuiz,
  onOpenPassport,
  onSelectBooth,
}: WelcomeProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;

  const handleBoothClick = (booth: BoothConfig) => {
    if (participant && onSelectBooth) {
      onSelectBooth(booth);
    } else {
      onStart();
    }
  };

  return (
    <div className="ts-page ts-page--welcome">
      {/* 1. Official Innovation Showcase Poster Hero Card */}
      <div className="ts-poster-card" role="region" aria-label="Innovation Showcase 2026 Poster">
        <div className="ts-poster-card__overlay" />

        <div className="ts-poster-header">
          <span className="ts-poster-brand">WELLSFARGO</span>
          <h1 className="ts-poster-title">Innovation Showcase 2026</h1>
          <p className="ts-poster-location">Bengaluru | Hyderabad | Virtual</p>
          <div className="ts-poster-badge">Innovate . Adopt . Reuse</div>
        </div>

        {/* Center Focal Highlight */}
        <div className="ts-poster-center">
          {targetBooth ? (
            <div className="ts-poster-scanned-booth">
              <span className="ts-scanned-icon">{targetBooth.icon}</span>
              <div className="ts-scanned-info">
                <span className="ts-scanned-pill">SCANNED BOOTH #{targetBooth.number}</span>
                <h3 className="ts-scanned-title">{targetBooth.title}</h3>
                <p className="ts-scanned-sub">Tap below to register & begin your quiz</p>
              </div>
            </div>
          ) : (
            <div className="ts-poster-spark-aura" aria-hidden="true" />
          )}
        </div>

        {/* Schedule Glass Card */}
        <div className="ts-poster-schedule">
          <div className="ts-poster-schedule__row">
            <span className="ts-poster-schedule__label">Tech Talks</span>
            <span className="ts-poster-schedule__divider">|</span>
            <span className="ts-poster-schedule__date">October 26-30, 2026</span>
          </div>
          <hr className="ts-poster-schedule__hr" />
          <div className="ts-poster-schedule__row">
            <span className="ts-poster-schedule__label">Flagship event</span>
            <span className="ts-poster-schedule__divider">|</span>
            <span className="ts-poster-schedule__date">November 2, 2026</span>
          </div>
        </div>

        {/* Primary Action Button (Poster Theme Red Pill) */}
        <div className="ts-poster-cta-container">
          <button
            type="button"
            className="ts-poster-cta-btn"
            onClick={hasSavedQuiz ? onResume : onStart}
          >
            {hasSavedQuiz
              ? 'Resume Active Quiz ⚡'
              : participant
              ? 'Enter Challenge Passport →'
              : 'Register Now'}
          </button>

          {participant && (
            <div className="ts-poster-user-strip">
              <span>👋 Welcome, <strong>{participant.name}</strong> ({participant.entId})</span>
              <button type="button" className="ts-poster-text-link" onClick={onOpenPassport}>
                View Passport ({completedCount}/{REQUIRED_BOOTHS_TO_WIN}) →
              </button>
            </div>
          )}
        </div>

        {/* Info Icon */}
        <button
          type="button"
          className="ts-poster-info-btn"
          onClick={() => setShowInfoModal(!showInfoModal)}
          aria-label="Event information and rules"
          title="Summit Challenge Rules & Details"
        >
          ⓘ
        </button>
      </div>

      {/* 2. Challenge Overview Stats */}
      <div className="ts-info-cards" style={{ marginTop: '24px' }}>
        <div className="ts-info-card">
          <span className="ts-info-card__value">{TOTAL_BOOTHS}</span>
          <span className="ts-info-card__label">TECH BOOTHS</span>
        </div>
        <div className="ts-info-card">
          <span className="ts-info-card__value">{REQUIRED_BOOTHS_TO_WIN}</span>
          <span className="ts-info-card__label">MIN TO WIN PRIZE</span>
        </div>
        <div className="ts-info-card">
          <span className="ts-info-card__value">60s</span>
          <span className="ts-info-card__label">PER BOOTH QUIZ</span>
        </div>
      </div>

      {/* 3. The 9-Booth Technology Challenge Section */}
      <div className="ts-showcase-section">
        <div className="ts-showcase-section__header">
          <span className="ts-page__eyebrow">SUMMIT INTERACTIVE CHALLENGE</span>
          <h2 className="ts-showcase-section__title">The 9 Technology Booths</h2>
          <p className="ts-showcase-section__desc">
            Visit physical booths across the summit floor or scan their QR codes.
            Complete at least <strong>{REQUIRED_BOOTHS_TO_WIN} booths</strong> to qualify for the official Summit Prize!
          </p>
        </div>

        <div className="ts-showcase-booths-grid">
          {BOOTHS.map((b) => (
            <div
              key={b.id}
              className={`ts-showcase-booth-card ${targetBooth?.id === b.id ? 'ts-showcase-booth-card--active' : ''}`}
              onClick={() => handleBoothClick(b)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleBoothClick(b);
              }}
            >
              <div className="ts-showcase-booth-card__top">
                <span className="ts-showcase-booth-card__num">#{b.number}</span>
                <span className="ts-showcase-booth-card__icon">{b.icon}</span>
              </div>
              <h3 className="ts-showcase-booth-card__title">{b.title}</h3>
              <p className="ts-showcase-booth-card__desc">{b.description}</p>
              <div className="ts-showcase-booth-card__footer">
                <span className="ts-showcase-booth-card__badge">{b.badge || b.category}</span>
                <span className="ts-showcase-booth-card__action">
                  {participant ? 'Launch Quiz →' : 'Register & Play →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Action Banner */}
      <div className="ts-welcome-actions" style={{ marginTop: '28px' }}>
        <Button onClick={hasSavedQuiz ? onResume : onStart} fullWidth>
          {hasSavedQuiz
            ? 'RESUME CURRENT QUIZ'
            : participant
            ? 'VIEW FULL PASSPORT & PROGRESS'
            : 'REGISTER FOR INNOVATION SHOWCASE'}
        </Button>

        {participant && (
          <Button variant="secondary" onClick={onOpenPassport} fullWidth>
            {isWinner
              ? '🏆 VIEW WINNER PASSPORT'
              : `📊 VIEW PROGRESS (${completedCount}/${REQUIRED_BOOTHS_TO_WIN} COMPLETED)`}
          </Button>
        )}
      </div>

      <p className="ts-page__footer">
        Scan QR codes at each physical booth or explore topics directly. Your score and progress automatically synchronize to the Summit results database.
      </p>

      {/* Info Dialog Modal */}
      {showInfoModal && (
        <div className="ts-qr-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="ts-qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: 'var(--brand-red)' }}>Innovation Showcase 2026 Details</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p><strong>Locations:</strong> Bengaluru | Hyderabad | Virtual</p>
              <p><strong>Theme:</strong> Innovate . Adopt . Reuse</p>
              <p><strong>Tech Talks:</strong> October 26-30, 2026</p>
              <p><strong>Flagship Event:</strong> November 2, 2026</p>
              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
              <p><strong>The 9-Booth Tech Challenge Rules:</strong></p>
              <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                <li>Complete quizzes across 9 specialized technology booths.</li>
                <li>Each quiz features 5 dynamic questions with a 60-second timer.</li>
                <li>Completing at least <strong>4 booths</strong> qualifies you for the official Summit Winner Prize!</li>
                <li>Your results are permanently preserved in the Summit database.</li>
              </ul>
            </div>
            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <Button onClick={() => setShowInfoModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

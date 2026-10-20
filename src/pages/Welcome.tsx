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
      {/* 1. Executive Keynote Hero Banner */}
      <div className="ts-hero-card" role="region" aria-label="Innovation Showcase 2026 Keynote">
        <div className="ts-hero-card__glow-mesh" aria-hidden="true" />

        <div className="ts-hero-header">
          <div className="ts-hero-brand-row">
            <span className="ts-hero-company">WELLSFARGO</span>
            <span className="ts-hero-theme-badge">INNOVATE • ADOPT • REUSE</span>
          </div>

          <h1 className="ts-hero-title">
            Innovation Showcase <span className="ts-hero-title-accent">2026</span>
          </h1>

          <div className="ts-hero-location-pill">
            <span className="ts-hero-loc-dot" aria-hidden="true" />
            <span>Bengaluru &nbsp;|&nbsp; Hyderabad &nbsp;|&nbsp; Virtual</span>
          </div>
        </div>

        {/* Scanned Booth Callout if user entered via QR */}
        {targetBooth && (
          <div className="ts-hero-scanned-card">
            <span className="ts-hero-scanned-icon">{targetBooth.icon}</span>
            <div className="ts-hero-scanned-text">
              <span className="ts-hero-scanned-label">QR CODE DETECTED</span>
              <h3 className="ts-hero-scanned-title">Booth #{targetBooth.number}: {targetBooth.title}</h3>
            </div>
          </div>
        )}

        {/* Schedule Glass Strip */}
        <div className="ts-hero-schedule-strip">
          <div className="ts-hero-schedule-item">
            <span className="ts-hero-schedule-icon" aria-hidden="true">🎙️</span>
            <div className="ts-hero-schedule-copy">
              <span className="ts-hero-schedule-label">Tech Talks</span>
              <span className="ts-hero-schedule-date">October 26–30, 2026</span>
            </div>
          </div>
          <div className="ts-hero-schedule-divider" aria-hidden="true" />
          <div className="ts-hero-schedule-item">
            <span className="ts-hero-schedule-icon" aria-hidden="true">🏆</span>
            <div className="ts-hero-schedule-copy">
              <span className="ts-hero-schedule-label">Flagship Event</span>
              <span className="ts-hero-schedule-date">November 2, 2026</span>
            </div>
          </div>
        </div>

        {/* Hero CTA & User Status */}
        <div className="ts-hero-cta-group">
          <button
            type="button"
            className="ts-hero-primary-btn"
            onClick={hasSavedQuiz ? onResume : onStart}
          >
            <span className="ts-hero-primary-btn__text">
              {hasSavedQuiz
                ? 'Resume Active Quiz ⚡'
                : participant
                ? 'Enter Challenge Passport →'
                : 'Register for Tech Challenge ⚡'}
            </span>
          </button>

          {participant ? (
            <div className="ts-hero-user-strip">
              <span>👋 Welcome back, <strong>{participant.name}</strong> ({participant.entId})</span>
              <button type="button" className="ts-hero-passport-link" onClick={onOpenPassport}>
                Passport Progress ({completedCount}/{REQUIRED_BOOTHS_TO_WIN}) →
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ts-hero-rules-link"
              onClick={() => setShowInfoModal(true)}
            >
              ⓘ View Challenge Guidelines & Prize Rules
            </button>
          )}
        </div>
      </div>

      {/* 2. Challenge Overview Stats */}
      <div className="ts-info-cards">
        <div className="ts-info-card">
          <span className="ts-info-card__icon" aria-hidden="true">🎪</span>
          <span className="ts-info-card__value">{TOTAL_BOOTHS}</span>
          <span className="ts-info-card__label">TECH BOOTHS</span>
        </div>
        <div className="ts-info-card">
          <span className="ts-info-card__icon" aria-hidden="true">🏆</span>
          <span className="ts-info-card__value">{REQUIRED_BOOTHS_TO_WIN}</span>
          <span className="ts-info-card__label">MIN TO WIN PRIZE</span>
        </div>
        <div className="ts-info-card">
          <span className="ts-info-card__icon" aria-hidden="true">⏱️</span>
          <span className="ts-info-card__value">60s</span>
          <span className="ts-info-card__label">PER BOOTH CHALLENGE</span>
        </div>
      </div>

      {/* 3. The 9-Booth Technology Challenge Section */}
      <div className="ts-showcase-section">
        <div className="ts-showcase-section__header">
          <span className="ts-page__eyebrow">EXPLORE & COMPETE</span>
          <h2 className="ts-showcase-section__title">The 9 Technology Booths</h2>
          <p className="ts-showcase-section__desc">
            Visit physical booths or explore topics online. Complete quizzes in at least{' '}
            <strong>{REQUIRED_BOOTHS_TO_WIN} booths</strong> to qualify for the official Summit Winner Prize!
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
                <span className="ts-showcase-booth-card__num">BOOTH #{b.number}</span>
                <span className="ts-showcase-booth-card__icon" aria-hidden="true">{b.icon}</span>
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
      <div className="ts-welcome-actions">
        <Button onClick={hasSavedQuiz ? onResume : onStart} fullWidth>
          {hasSavedQuiz
            ? 'RESUME CURRENT QUIZ ⚡'
            : participant
            ? 'VIEW FULL PASSPORT & PROGRESS →'
            : 'REGISTER FOR INNOVATION SHOWCASE ⚡'}
        </Button>

        {participant && (
          <Button variant="secondary" onClick={onOpenPassport} fullWidth>
            {isWinner
              ? '🏆 VIEW WINNER PASSPORT'
              : `📊 VIEW PASSPORT PROGRESS (${completedCount}/${REQUIRED_BOOTHS_TO_WIN} COMPLETED)`}
          </Button>
        )}
      </div>

      <p className="ts-page__footer">
        Scan physical QR codes at each booth or launch directly above. Scores synchronize in real-time with Firebase Firestore.
      </p>

      {/* Info Dialog Modal */}
      {showInfoModal && (
        <div className="ts-modal-overlay" onClick={() => setShowInfoModal(false)} role="dialog" aria-modal="true">
          <div className="ts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-header">
              <div className="ts-modal-header__brand">
                <div className="ts-modal-header__icon-badge" aria-hidden="true">💡</div>
                <div>
                  <div className="ts-modal-eyebrow">CHALLENGE GUIDELINES</div>
                  <h2 className="ts-modal-title">Innovation Showcase 2026</h2>
                </div>
              </div>
              <button
                type="button"
                className="ts-modal-close-btn"
                onClick={() => setShowInfoModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="ts-modal-body">
              <div className="ts-sync-destination-card">
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Venues:</span>
                  <span className="ts-sync-dest-value">Bengaluru | Hyderabad | Virtual</span>
                </div>
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Theme:</span>
                  <span className="ts-sync-dest-value" style={{ color: 'var(--accent-gold)' }}>INNOVATE • ADOPT • REUSE</span>
                </div>
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Tech Talks:</span>
                  <span className="ts-sync-dest-value">October 26–30, 2026</span>
                </div>
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Flagship Event:</span>
                  <span className="ts-sync-dest-value">November 2, 2026</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Interactive 9-Booth Rules:
                </h4>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                  <li>Participate in quizzes across 9 core architectural and emerging technology booths.</li>
                  <li>Each booth quiz has 5 targeted questions with a rapid 60-second timer.</li>
                  <li>Complete at least <strong>4 booths</strong> to qualify for the official Summit Winner Prize!</li>
                  <li>All registrations and attempts persist directly to Firebase Firestore.</li>
                </ul>
              </div>

              <div className="ts-modal-actions">
                <Button variant="primary" onClick={() => setShowInfoModal(false)}>
                  Got it, Let's Play!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import type { BoothConfig, Participant } from '../types';
import { Button } from '../components/Button';
import { REQUIRED_BOOTHS_TO_WIN } from '../data/boothsConfig';

interface WelcomeProps {
  targetBooth: BoothConfig | null;
  participant: Participant | null;
  completedCount: number;
  onStart: () => void;
  onResume: () => void;
  hasSavedQuiz: boolean;
  onOpenPassport: () => void;
}

export function Welcome({
  targetBooth,
  participant,
  completedCount,
  onStart,
  onResume,
  hasSavedQuiz,
  onOpenPassport,
}: WelcomeProps) {
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;

  return (
    <div className="ts-page ts-page--welcome">
      <div className="ts-page__container">
        <span className="ts-page__eyebrow">TECHNOLOGY SUMMIT 2026</span>
        <h1 className="ts-page__title">THE 9-BOOTH TECH CHALLENGE</h1>
        <p className="ts-page__subtitle">SCAN • COMPETE • QUALIFY TO WIN</p>

        {targetBooth ? (
          <div className="ts-welcome-booth-highlight">
            <div className="ts-booth-highlight-icon">{targetBooth.icon}</div>
            <div className="ts-booth-highlight-meta">
              <span className="ts-booth-highlight-badge">CURRENT SCANNED BOOTH #{targetBooth.number}</span>
              <h2 className="ts-booth-highlight-title">{targetBooth.title}</h2>
              <p className="ts-booth-highlight-desc">{targetBooth.description}</p>
            </div>
          </div>
        ) : (
          <p className="ts-page__description">
            Explore 9 technology booths across the summit floor. Each booth features a 60-second, 5-question challenge.
            Play at least <strong>{REQUIRED_BOOTHS_TO_WIN} booths</strong> to qualify for the official Summit Prize!
          </p>
        )}

        <div className="ts-info-cards">
          <div className="ts-info-card">
            <span className="ts-info-card__value">9</span>
            <span className="ts-info-card__label">TOTAL BOOTHS</span>
          </div>
          <div className="ts-info-card">
            <span className="ts-info-card__value">{REQUIRED_BOOTHS_TO_WIN}</span>
            <span className="ts-info-card__label">MIN TO WIN</span>
          </div>
          <div className="ts-info-card">
            <span className="ts-info-card__value">60s</span>
            <span className="ts-info-card__label">PER BOOTH</span>
          </div>
        </div>

        {participant && (
          <div className="ts-welcome-registered-notice">
            <span>👋 Welcome back, <strong>{participant.name}</strong> ({participant.company})</span>
            <button type="button" className="ts-link-btn" onClick={onOpenPassport}>
              View Your Passport ({completedCount}/{REQUIRED_BOOTHS_TO_WIN}) →
            </button>
          </div>
        )}

        <div className="ts-welcome-actions">
          <Button onClick={hasSavedQuiz ? onResume : onStart} fullWidth>
            {hasSavedQuiz
              ? 'RESUME CURRENT QUIZ'
              : targetBooth
              ? `START BOOTH ${targetBooth.number} QUIZ`
              : 'ENTER THE CHALLENGE'}
          </Button>

          {completedCount > 0 && (
            <Button variant="secondary" onClick={onOpenPassport} fullWidth>
              {isWinner ? '🏆 VIEW WINNER PASSPORT' : `📊 VIEW PROGRESS (${completedCount}/${REQUIRED_BOOTHS_TO_WIN})`}
            </Button>
          )}
        </div>

        <p className="ts-page__footer">
          Scan the QR code at each booth to unlock its questions. Your progress is automatically remembered on this device.
        </p>
      </div>
    </div>
  );
}

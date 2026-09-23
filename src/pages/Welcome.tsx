import { Button } from '../components/Button';

interface WelcomeProps {
  onStart: () => void;
  onResume: () => void;
  hasSavedQuiz: boolean;
}

export function Welcome({ onStart, onResume, hasSavedQuiz }: WelcomeProps) {
  return (
    <div className="ts-page ts-page--welcome">
      <div className="ts-page__container">
        <span className="ts-page__eyebrow">2026</span>
        <h1 className="ts-page__title">HOW TECH-SMART ARE YOU?</h1>
        <p className="ts-page__subtitle">THE 60-SECOND TECH CHALLENGE</p>
        <p className="ts-page__description">
          Test your technology knowledge across AI, cloud, cybersecurity, data and emerging technologies.
        </p>

        <div className="ts-info-cards">
          <div className="ts-info-card">
            <span className="ts-info-card__value">5</span>
            <span className="ts-info-card__label">QUESTIONS</span>
          </div>
          <div className="ts-info-card">
            <span className="ts-info-card__value">60</span>
            <span className="ts-info-card__label">SECONDS</span>
          </div>
          <div className="ts-info-card">
            <span className="ts-info-card__value">1</span>
            <span className="ts-info-card__label">ATTEMPT</span>
          </div>
        </div>

        <Button onClick={hasSavedQuiz ? onResume : onStart} fullWidth>
          {hasSavedQuiz ? 'RESUME CHALLENGE' : 'START CHALLENGE'}
        </Button>

        <p className="ts-page__footer">
          Your browser generates a participation identifier to help prevent duplicate attempts.
        </p>
      </div>
    </div>
  );
}

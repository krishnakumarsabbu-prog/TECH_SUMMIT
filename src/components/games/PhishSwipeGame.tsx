import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface PhishSwipeGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    cards?: Array<{
      sender: string;
      subject: string;
      preview: string;
      isPhish: boolean;
      explanation: string;
    }>;
  };
}

const DEFAULT_CARDS = [
  {
    sender: 'CEO (exec-urgent-msg@gmail.com)',
    subject: 'URGENT: Confidential Task Needed',
    preview: 'Hey, I am in a board meeting. Can you immediately buy 15 Apple gift cards for clients? Send codes here.',
    isPhish: true,
    explanation: 'Classic CEO Impersonation with external gmail address!',
  },
  {
    sender: 'GitHub Enterprise (noreply@github.internal)',
    subject: '[Security] Dependabot Alert: Bump express to 4.21.0',
    preview: 'Automated PR #402 opened to remediate CVE-2026-1188 with zero breaking changes.',
    isPhish: false,
    explanation: 'Legitimate internal automated security patch!',
  },
  {
    sender: 'IT-Helpdesk-Desk@corp-logins-auth.net',
    subject: 'ACTION REQUIRED: Password Expiring in 10 mins',
    preview: 'Click this non-corporate link to verify your active password and MFA seed key now.',
    isPhish: true,
    explanation: 'Phishing domain attempting credential theft!',
  },
  {
    sender: 'AWS CloudWatch (alerts@amazonaws.com)',
    subject: 'ALARM: CPUUtilization > 85% on node-prod-04',
    preview: 'Threshold breached for 5 consecutive minutes. PagerDuty auto-incident initiated.',
    isPhish: false,
    explanation: 'Standard verified cloud monitoring alarm.',
  },
];

export function PhishSwipeGame({ onFinish, gameData }: PhishSwipeGameProps) {
  const cards = gameData?.cards && gameData.cards.length > 0 ? gameData.cards : DEFAULT_CARDS;
  const targetCorrect = 4;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    if (correctCount >= targetCorrect) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    } else if (currentIndex >= cards.length) {
      setGameOver(true);
      const won = correctCount >= targetCorrect;
      if (won) playSuccessChime();
      else playFailBuzz();
      setTimeout(() => onFinish(won), 1300);
    }
  }, [correctCount, currentIndex, cards.length, targetCorrect, gameOver, onFinish]);

  const currentCard = cards[currentIndex % cards.length];

  const handleDecision = (userSaidPhish: boolean) => {
    if (gameOver || !currentCard || feedback) return;

    const isCorrect = userSaidPhish === currentCard.isPhish;
    if (isCorrect) {
      playZapSound();
      setCorrectCount((c) => c + 1);
      setFeedback({ isCorrect: true, text: `CORRECT! ${currentCard.explanation}` });
    } else {
      playFailBuzz();
      setFeedback({ isCorrect: false, text: `TRIPPED! ${currentCard.explanation}` });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIndex((idx) => idx + 1);
    }, 850);
  };

  return (
    <div className="ts-arcade-game ts-arcade-game--swipe">
      {/* Game HUD */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">🛡️</span>
          <span>Zero Trust Gate: Classify request as <strong>PHISH</strong> or <strong>LEGIT</strong>!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">TRIAGED</span>
          <span className="ts-arcade-hud__value">{correctCount}/{targetCorrect} ⭐</span>
        </div>
      </div>

      {/* Modern Email Client Stage */}
      <div className="ts-email-stage">
        {currentCard ? (
          <div className={`ts-email-card ${feedback ? (feedback.isCorrect ? 'ts-email-card--correct' : 'ts-email-card--wrong') : ''}`}>
            <div className="ts-email-card__top">
              <div className="ts-email-avatar">✉️</div>
              <div className="ts-email-headers">
                <div className="ts-email-sender">{currentCard.sender}</div>
                <div className="ts-email-subject">{currentCard.subject}</div>
              </div>
              <span className="ts-email-counter">REQ #{currentIndex + 1}</span>
            </div>

            <div className="ts-email-body">
              <p>"{currentCard.preview}"</p>
            </div>

            {feedback && (
              <div className={`ts-email-feedback ${feedback.isCorrect ? 'ts-text-emerald' : 'ts-text-danger'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        ) : null}

        {/* Big Tactile Arcade Action Buttons */}
        <div className="ts-phish-actions">
          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--phish"
            onClick={() => handleDecision(true)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">🚫</span>
            <span className="ts-phish-btn__text">BLOCK / PHISH</span>
          </button>

          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--legit"
            onClick={() => handleDecision(false)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">✅</span>
            <span className="ts-phish-btn__text">VERIFY / LEGIT</span>
          </button>
        </div>
      </div>

      {correctCount >= targetCorrect && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🛡️</span>
            <h3>Zero Trust Defended!</h3>
            <p>You caught all malicious intrusions with zero security breaches!</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { playSuccessChime, playFailBuzz, playZapSound } from '../../utils/qrHelper';

interface FraudBlitzGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    transactions?: Array<{
      id: string;
      amount: string;
      merchant: string;
      location: string;
      isFraud: boolean;
      reason: string;
    }>;
  };
}

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx1',
    amount: '$4.50',
    merchant: 'Third Wave Coffee',
    location: 'Bengaluru Tech Park',
    isFraud: false,
    reason: 'Routine local coffee purchase by employee.',
  },
  {
    id: 'tx2',
    amount: '$9,800.00',
    merchant: 'Untraced Casino Crypto Vouchers',
    location: 'Cayman Islands (IP Proxy)',
    isFraud: true,
    reason: 'High-value crypto purchase with proxy IP at 3:12 AM.',
  },
  {
    id: 'tx3',
    amount: '$1.20',
    merchant: 'Metro Transit Gate Scan',
    location: 'Namma Metro Bengaluru',
    isFraud: false,
    reason: 'Verified contactless NFC transit tap.',
  },
  {
    id: 'tx4',
    amount: '$50,000.00',
    merchant: 'Instant Wire to "TotalLegitLLC"',
    location: 'Newly created domain (Age: 2 mins)',
    isFraud: true,
    reason: 'Wire to shell company registered 2 minutes ago.',
  },
];

export function FraudBlitzGame({ onFinish, gameData }: FraudBlitzGameProps) {
  const list = gameData?.transactions && gameData.transactions.length > 0 ? gameData.transactions : DEFAULT_TRANSACTIONS;
  const targetPass = 4;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;
    if (correctCount >= targetPass) {
      setGameOver(true);
      playSuccessChime();
      setTimeout(() => onFinish(true), 1200);
    } else if (currentIndex >= list.length) {
      setGameOver(true);
      const won = correctCount >= targetPass;
      if (won) playSuccessChime();
      else playFailBuzz();
      setTimeout(() => onFinish(won), 1300);
    }
  }, [correctCount, currentIndex, list.length, targetPass, gameOver, onFinish]);

  const currentTx = list[currentIndex % list.length];

  const handleDecision = (userFlaggedFraud: boolean) => {
    if (gameOver || !currentTx || feedback) return;

    const isCorrect = userFlaggedFraud === currentTx.isFraud;
    if (isCorrect) {
      playZapSound();
      setCorrectCount((c) => c + 1);
      setFeedback({ isCorrect: true, text: `CORRECT! ${currentTx.reason}` });
    } else {
      playFailBuzz();
      setFeedback({ isCorrect: false, text: `ERROR! ${currentTx.reason}` });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIndex((i) => i + 1);
    }, 850);
  };

  return (
    <div className="ts-arcade-game ts-arcade-game--fraud">
      {/* Game HUD */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">🏦</span>
          <span>Risk Gate: <strong>APPROVE</strong> routine vs <strong>BLOCK</strong> fraud!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">VERIFIED</span>
          <span className="ts-arcade-hud__value">{correctCount}/{targetPass} 💳</span>
        </div>
      </div>

      {/* Fintech Terminal Stage */}
      <div className="ts-fintech-stage">
        {currentTx ? (
          <div className={`ts-fraud-card ${feedback ? (feedback.isCorrect ? 'ts-fraud-card--correct' : 'ts-fraud-card--wrong') : ''}`}>
            <div className="ts-fraud-card__header">
              <span className="ts-fraud-card__badge">SETTLEMENT STREAM</span>
              <span className="ts-fraud-card__index">TX #{currentIndex + 1}</span>
            </div>

            <div className="ts-fraud-card__amount">{currentTx.amount}</div>
            <div className="ts-fraud-card__merchant">🏪 {currentTx.merchant}</div>
            <div className="ts-fraud-card__location">📍 {currentTx.location}</div>

            {feedback && (
              <div className={`ts-fraud-card__feedback ${feedback.isCorrect ? 'ts-text-emerald' : 'ts-text-danger'}`}>
                {feedback.text}
              </div>
            )}
          </div>
        ) : null}

        {/* Big Touch Buttons */}
        <div className="ts-fraud-actions">
          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--phish"
            onClick={() => handleDecision(true)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">🚫</span>
            <span className="ts-phish-btn__text">BLOCK FRAUD</span>
          </button>

          <button
            type="button"
            className="ts-phish-btn ts-phish-btn--legit"
            onClick={() => handleDecision(false)}
            disabled={Boolean(feedback) || gameOver}
          >
            <span className="ts-phish-btn__icon">✅</span>
            <span className="ts-phish-btn__text">APPROVE</span>
          </button>
        </div>
      </div>

      {correctCount >= targetPass && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🏦</span>
            <h3>Treasury Protected!</h3>
            <p>Risk intelligence agent cleared authentic transactions and blocked fraud!</p>
          </div>
        </div>
      )}
    </div>
  );
}

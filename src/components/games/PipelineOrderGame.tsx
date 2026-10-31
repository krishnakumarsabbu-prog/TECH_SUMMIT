import { useState } from 'react';
import { playSuccessChime, playZapSound } from '../../utils/qrHelper';

interface PipelineOrderGameProps {
  onFinish: (won: boolean) => void;
  gameData?: {
    steps: Array<{ id: string; label: string; icon: string; order: number }>;
  };
}

const DEFAULT_PIPELINE = [
  { id: 'p1', label: '1. Lint & Code Quality Check', icon: '🧹', order: 0 },
  { id: 'p2', label: '2. Run Automated Unit Tests', icon: '🧪', order: 1 },
  { id: 'p3', label: '3. Peer Code Review & Security Gate', icon: '🛡️', order: 2 },
  { id: 'p4', label: '4. Blue-Green Production Deploy', icon: '🚀', order: 3 },
];

export function PipelineOrderGame({ onFinish, gameData }: PipelineOrderGameProps) {
  const targetSteps = gameData?.steps ?? DEFAULT_PIPELINE;
  // Scramble the steps initially
  const [currentOrder, setCurrentOrder] = useState<Array<{ id: string; label: string; icon: string; order: number }>>(() => {
    return [...targetSteps].sort(() => Math.random() - 0.5);
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleCardClick = (idx: number) => {
    if (gameOver) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
      playZapSound();
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      // Swap items
      playZapSound();
      const updated = [...currentOrder];
      const temp = updated[selectedIdx];
      updated[selectedIdx] = updated[idx];
      updated[idx] = temp;
      setCurrentOrder(updated);
      setSelectedIdx(null);

      // Check if correctly ordered
      const isCorrect = updated.every((item, i) => item.order === i);
      if (isCorrect) {
        setWon(true);
        setGameOver(true);
        playSuccessChime();
        setTimeout(() => onFinish(true), 1300);
      }
    }
  };

  const correctCount = currentOrder.filter((item, i) => item.order === i).length;

  return (
    <div className="ts-arcade-game ts-arcade-game--pipeline">
      {/* Game HUD */}
      <div className="ts-arcade-hud">
        <div className="ts-arcade-hud__mission">
          <span className="ts-arcade-hud__icon">⚡</span>
          <span>Tap <strong>any two stages</strong> to swap into deployment order!</span>
        </div>
        <div className="ts-arcade-hud__progress">
          <span className="ts-arcade-hud__label">PIPELINE</span>
          <span className="ts-arcade-hud__value">{correctCount}/4 IN ORDER</span>
        </div>
      </div>

      {/* Visual Pipeline Conveyor */}
      <div className="ts-conveyor-track">
        {currentOrder.map((step, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrectPos = step.order === idx;

          return (
            <div key={step.id} className="ts-conveyor-slot">
              <button
                type="button"
                className={`ts-pipeline-card ${isSelected ? 'ts-pipeline-card--selected' : ''} ${isCorrectPos ? 'ts-pipeline-card--correct' : ''}`}
                onClick={() => handleCardClick(idx)}
                disabled={gameOver}
              >
                <div className="ts-pipeline-card__badge">
                  <span>STAGE {idx + 1}</span>
                  {isCorrectPos && <span className="ts-badge-check">✓</span>}
                </div>
                <div className="ts-pipeline-card__body">
                  <span className="ts-pipeline-card__icon">{step.icon}</span>
                  <span className="ts-pipeline-card__label">{step.label}</span>
                </div>
                <span className="ts-pipeline-card__action">
                  {isSelected ? '⇄ TAP SECOND STAGE TO SWAP' : (isCorrectPos ? '✓ LOCKED' : 'TAP TO MOVE')}
                </span>
              </button>

              {idx < currentOrder.length - 1 && (
                <div className={`ts-pipeline-arrow ${isCorrectPos ? 'ts-pipeline-arrow--active' : ''}`}>
                  ➔
                </div>
              )}
            </div>
          );
        })}
      </div>

      {won && (
        <div className="ts-game-overlay ts-game-overlay--success">
          <div className="ts-game-overlay__card">
            <span className="ts-game-overlay__emoji">🚀</span>
            <h3>CI/CD Pipeline Shipped!</h3>
            <p>Code built, tested, reviewed, and deployed to production!</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { playCelebrationSound } from '../utils/qrHelper';

interface ConfettiCelebrationProps {
  onComplete: () => void;
}

const colors = ['#ff934c', '#ff3c7e', '#63dcc9', '#8fa8ff', '#ffe08a'];

export function ConfettiCelebration({ onComplete }: ConfettiCelebrationProps) {
  useEffect(() => {
    playCelebrationSound();
    const timer = window.setTimeout(onComplete, 5200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="ts-celebration" role="status" aria-live="polite">
      <div className="ts-celebration__backdrop" />
      <div className="ts-celebration__message">
        <span className="ts-celebration__eyebrow">ALL BOOTHS COMPLETE</span>
        <strong>Summit winner unlocked</strong>
        <span>Your passport is fully qualified.</span>
      </div>
      <div className="ts-confetti" aria-hidden="true">
        {Array.from({ length: 64 }, (_, index) => (
          <span
            key={index}
            className="ts-confetti__piece"
            style={{
              '--confetti-x': `${(index * 37) % 112 - 6}%`,
              '--confetti-delay': `${(index % 12) * 70}ms`,
              '--confetti-duration': `${3200 + (index % 7) * 260}ms`,
              '--confetti-color': colors[index % colors.length],
              '--confetti-rotate': `${(index * 41) % 360}deg`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

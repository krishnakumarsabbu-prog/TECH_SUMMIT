import { useEffect, useState } from 'react';
import { getRemainingSeconds, getTimerPhase, TIMER_DURATION_SECONDS } from '../utils/timer';

interface TimerProps {
  startTime: number;
  endTime: number | null;
  onExpire: () => void;
}

export function Timer({ startTime, endTime, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(startTime, endTime));

  useEffect(() => {
    if (endTime !== null) {
      setRemaining(getRemainingSeconds(startTime, endTime));
      return;
    }
    const interval = setInterval(() => {
      const r = getRemainingSeconds(startTime, null);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [startTime, endTime, onExpire]);

  const phase = getTimerPhase(remaining);
  const display = String(remaining).padStart(2, '0');

  return (
    <div className={`ts-timer ts-timer--${phase}`} aria-live="polite" aria-label={`Time remaining: ${remaining} seconds`}>
      <span className="ts-timer__value">{display}</span>
      <span className="ts-timer__unit">SECONDS</span>
    </div>
  );
}

export { TIMER_DURATION_SECONDS };

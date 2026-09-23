export const TIMER_DURATION_SECONDS = 60;

export function getRemainingSeconds(startTime: number, endTime: number | null): number {
  const reference = endTime ?? Date.now();
  const elapsed = Math.floor((reference - startTime) / 1000);
  const remaining = TIMER_DURATION_SECONDS - elapsed;
  return Math.max(0, remaining);
}

export type TimerPhase = 'normal' | 'warning' | 'critical';

export function getTimerPhase(remaining: number): TimerPhase {
  if (remaining <= 10) return 'critical';
  if (remaining <= 20) return 'warning';
  return 'normal';
}

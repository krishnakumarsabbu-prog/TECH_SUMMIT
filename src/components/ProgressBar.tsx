interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="ts-progress" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      <div className="ts-progress__track">
        <div className="ts-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="ts-progress__label">QUESTION {current + 1} OF {total}</span>
    </div>
  );
}

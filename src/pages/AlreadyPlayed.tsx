import type { QuizResult } from '../types';
import { Button } from '../components/Button';

interface AlreadyPlayedProps {
  result: QuizResult | null;
  completedAt: string | null;
  onDone: () => void;
}

export function AlreadyPlayed({ result, completedAt, onDone }: AlreadyPlayedProps) {
  return (
    <div className="ts-page ts-page--already-played">
      <div className="ts-page__container">
        <div className="ts-already-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="3" />
            <path d="M16 24l6 6 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="ts-page__title ts-page__title--sm">CHALLENGE ALREADY COMPLETED</h1>
        <p className="ts-page__description">
          You have already completed the Technology Summit challenge. Your previous attempt has been recorded.
        </p>

        {result && (
          <div className="ts-already-summary">
            <div className="ts-already-summary__row">
              <span>Score</span>
              <span className="ts-already-summary__value">{result.score} / {result.totalQuestions}</span>
            </div>
            <div className="ts-already-summary__row">
              <span>Completion time</span>
              <span className="ts-already-summary__value">{result.timeTakenSeconds} seconds</span>
            </div>
            {completedAt && (
              <div className="ts-already-summary__row">
                <span>Date / time</span>
                <span className="ts-already-summary__value">{new Date(completedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <Button onClick={onDone} fullWidth>DONE</Button>
      </div>
    </div>
  );
}

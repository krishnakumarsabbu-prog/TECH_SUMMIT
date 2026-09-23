import type { QuizResult } from '../types';
import { Button } from '../components/Button';
import { ScoreCard } from '../components/ScoreCard';

interface ResultsProps {
  result: QuizResult;
  onDone: () => void;
  downloadError: string | null;
}

export function Results({ result, onDone, downloadError }: ResultsProps) {
  return (
    <div className="ts-page ts-page--results">
      <div className="ts-page__container">
        <h1 className="ts-page__title ts-page__title--sm">CHALLENGE COMPLETE</h1>
        <ScoreCard result={result} />

        {downloadError && (
          <p className="ts-error-message" role="alert">
            {downloadError}
          </p>
        )}

        <Button onClick={onDone} fullWidth>DONE</Button>
      </div>
    </div>
  );
}

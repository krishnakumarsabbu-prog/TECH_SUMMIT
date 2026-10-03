import type { QuizResult } from '../types';
import { Button } from '../components/Button';
import { ScoreCard } from '../components/ScoreCard';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';

interface ResultsProps {
  result: QuizResult;
  boothTitle?: string;
  boothNumber?: number;
  completedCount: number;
  onDone: () => void;
  downloadError: string | null;
}

export function Results({
  result,
  boothTitle,
  boothNumber,
  completedCount,
  onDone,
  downloadError,
}: ResultsProps) {
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  return (
    <div className="ts-page ts-page--results">
      <div className="ts-page__container">
        {boothNumber && (
          <div className="ts-results-booth-pill">
            <span>✓ BOOTH {boothNumber} CHALLENGE SUBMITTED</span>
          </div>
        )}

        <h1 className="ts-page__title ts-page__title--sm">
          {boothTitle ? `${boothTitle.toUpperCase()}` : 'CHALLENGE COMPLETE'}
        </h1>

        <ScoreCard result={result} />

        {/* Milestone Card */}
        <div className={`ts-milestone-card ${isWinner ? 'ts-milestone-card--winner' : 'ts-milestone-card--progress'}`}>
          <div className="ts-milestone-icon" aria-hidden="true">
            {isWinner ? '🏆' : '🎯'}
          </div>
          <div className="ts-milestone-info">
            <h3 className="ts-milestone-title">
              {isWinner ? '🎉 SUMMIT WINNER STATUS UNLOCKED!' : `MILESTONE: ${completedCount} OF ${REQUIRED_BOOTHS_TO_WIN} TO WIN`}
            </h3>
            <p className="ts-milestone-desc">
              {isWinner
                ? `You have conquered ${completedCount} of ${TOTAL_BOOTHS} booths! You are officially eligible for the Technology Summit prize.`
                : `Great job! You have completed ${completedCount} booth(s). Complete ${remaining} more booth ${remaining === 1 ? 'quiz' : 'quizzes'} to qualify.`}
            </p>
          </div>
        </div>

        {downloadError && (
          <p className="ts-error-message" role="alert">
            {downloadError}
          </p>
        )}

        <div className="ts-results-actions">
          <Button onClick={onDone} fullWidth>
            VIEW MY SUMMIT PASSPORT & ALL RESULTS →
          </Button>
        </div>
      </div>
    </div>
  );
}

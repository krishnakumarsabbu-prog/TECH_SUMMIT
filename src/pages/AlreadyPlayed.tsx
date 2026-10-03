import type { BoothResult, QuizResult } from '../types';
import { Button } from '../components/Button';
import { REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';

interface AlreadyPlayedProps {
  boothResult: BoothResult | null;
  overallResult: QuizResult | null;
  completedCount: number;
  completedAt: string | null;
  onDone: () => void;
  onExploreOtherBooths?: () => void;
}

export function AlreadyPlayed({
  boothResult,
  overallResult,
  completedCount,
  completedAt,
  onDone,
  onExploreOtherBooths,
}: AlreadyPlayedProps) {
  const result = boothResult ?? overallResult;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remaining = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  return (
    <div className="ts-page ts-page--already-played">
      <div className="ts-page__container">
        <div className="ts-already-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="3" />
            <path d="M16 24l6 6 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="ts-page__title ts-page__title--sm">
          {boothResult ? `BOOTH ${boothResult.boothNumber} ALREADY COMPLETED` : 'CHALLENGE ALREADY COMPLETED'}
        </h1>

        <p className="ts-page__description">
          {boothResult
            ? `You have already completed the quiz for "${boothResult.boothTitle}". Your score is saved to your Summit Passport.`
            : 'You have already recorded an attempt for this challenge.'}
        </p>

        {result && (
          <div className="ts-already-summary">
            {boothResult && (
              <div className="ts-already-summary__row">
                <span>Booth</span>
                <span className="ts-already-summary__value">Booth {boothResult.boothNumber}: {boothResult.boothTitle}</span>
              </div>
            )}
            <div className="ts-already-summary__row">
              <span>Score achieved</span>
              <span className="ts-already-summary__value">{result.score} / {result.totalQuestions} ({result.percentage}%)</span>
            </div>
            <div className="ts-already-summary__row">
              <span>Time taken</span>
              <span className="ts-already-summary__value">{result.timeTakenSeconds} seconds</span>
            </div>
            {completedAt && (
              <div className="ts-already-summary__row">
                <span>Completed at</span>
                <span className="ts-already-summary__value">{new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        )}

        {/* Milestone info */}
        <div className={`ts-milestone-card ${isWinner ? 'ts-milestone-card--winner' : 'ts-milestone-card--progress'}`}>
          <div className="ts-milestone-icon" aria-hidden="true">
            {isWinner ? '🏆' : '📍'}
          </div>
          <div className="ts-milestone-info">
            <h3 className="ts-milestone-title">
              {isWinner
                ? `PASSPORT STATUS: WINNER (${completedCount}/${TOTAL_BOOTHS} BOOTHS)`
                : `PASSPORT STATUS: ${completedCount} OF ${REQUIRED_BOOTHS_TO_WIN} COMPLETED`}
            </h3>
            <p className="ts-milestone-desc">
              {isWinner
                ? 'You have fulfilled the prize requirement! Head over to the summit prize desk.'
                : `Visit any of the remaining booths and scan their QR code to reach the 4-booth goal (needs ${remaining} more).`}
            </p>
          </div>
        </div>

        <div className="ts-already-actions">
          <Button onClick={onDone} fullWidth>
            OPEN MY SUMMIT PASSPORT & RESULTS
          </Button>

          {onExploreOtherBooths && (
            <Button variant="secondary" onClick={onExploreOtherBooths} fullWidth>
              EXPLORE REMAINING BOOTHS
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

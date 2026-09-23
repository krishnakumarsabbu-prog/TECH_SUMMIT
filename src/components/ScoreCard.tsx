import type { QuizResult } from '../types';

interface ScoreCardProps {
  result: QuizResult;
}

function scoreMessage(percentage: number): string {
  if (percentage >= 80) return 'Excellent technology awareness.';
  if (percentage >= 60) return 'Strong technology awareness.';
  if (percentage >= 40) return 'Good effort — there is room to grow.';
  return 'Thank you for participating in the challenge.';
}

export function ScoreCard({ result }: ScoreCardProps) {
  const message = scoreMessage(result.percentage);
  return (
    <div className="ts-score-card">
      <div className="ts-score-card__headline">
        <span className="ts-score-card__score">{result.score} / {result.totalQuestions}</span>
        <span className="ts-score-card__percentage">{result.percentage}%</span>
      </div>
      <div className="ts-score-card__time">
        <span className="ts-score-card__time-label">TIME TAKEN</span>
        <span className="ts-score-card__time-value">{result.timeTakenSeconds} seconds</span>
      </div>
      <div className="ts-score-card__breakdown">
        <div className="ts-score-card__row">
          <span>Correct</span>
          <span className="ts-score-card__value ts-score-card__value--correct">{result.correctAnswers}</span>
        </div>
        <div className="ts-score-card__row">
          <span>Incorrect</span>
          <span className="ts-score-card__value ts-score-card__value--incorrect">{result.incorrectAnswers}</span>
        </div>
        <div className="ts-score-card__row">
          <span>Unanswered</span>
          <span className="ts-score-card__value ts-score-card__value--unanswered">{result.unansweredAnswers}</span>
        </div>
      </div>
      <p className="ts-score-card__message">{message}</p>
      <p className="ts-score-card__disclaimer">This score represents only this quiz and does not indicate broader expertise.</p>
    </div>
  );
}

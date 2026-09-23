import { useCallback, useState } from 'react';
import type { QuizState } from '../types';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Timer } from '../components/Timer';
import { QuestionCard } from '../components/QuestionCard';

interface QuizProps {
  quizState: QuizState;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function Quiz({ quizState, onAnswer, onNext, onPrev, onSubmit, submitting }: QuizProps) {
  const [endTime, setEndTime] = useState<number | null>(quizState.endTime);
  const [expired, setExpired] = useState(false);

  const currentIndex = quizState.currentIndex;
  const question = quizState.questions[currentIndex];
  const isLast = currentIndex === quizState.questions.length - 1;

  const handleExpire = useCallback(() => {
    if (expired || submitting) return;
    setExpired(true);
    setEndTime(Date.now());
    onSubmit();
  }, [expired, submitting, onSubmit]);

  if (!question) {
    return (
      <div className="ts-page">
        <div className="ts-page__container">
          <p className="ts-error-message">Unable to load quiz questions. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ts-page ts-page--quiz">
      <div className="ts-page__container ts-page__container--wide">
        <div className="ts-quiz-top">
          <ProgressBar current={currentIndex} total={quizState.questions.length} />
          <Timer startTime={quizState.startTime} endTime={endTime ?? quizState.endTime} onExpire={handleExpire} />
        </div>

        <QuestionCard
          question={question}
          selectedIndex={quizState.answers[currentIndex]}
          onSelect={(idx) => onAnswer(currentIndex, idx)}
        />

        <div className="ts-quiz-actions">
          <Button variant="secondary" onClick={onPrev} disabled={currentIndex === 0 || submitting || expired}>
            BACK
          </Button>
          {isLast ? (
            <Button onClick={onSubmit} disabled={submitting || expired}>
              {submitting ? 'SUBMITTING…' : 'SUBMIT CHALLENGE'}
            </Button>
          ) : (
            <Button onClick={onNext} disabled={submitting || expired}>
              NEXT
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

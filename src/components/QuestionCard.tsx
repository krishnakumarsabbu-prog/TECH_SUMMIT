import type { QuizQuestion } from '../types';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuestionCard({ question, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div className="ts-question-card">
      <div className="ts-question-card__category">{question.category}</div>
      <h2 className="ts-question-card__text">{question.question}</h2>
      <div className="ts-question-card__options" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, idx) => {
          const selected = selectedIndex === idx;
          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`ts-option ${selected ? 'ts-option--selected' : ''}`}
              onClick={() => onSelect(idx)}
            >
              <span className="ts-option__letter" aria-hidden="true">{LETTERS[idx]}</span>
              <span className="ts-option__text">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

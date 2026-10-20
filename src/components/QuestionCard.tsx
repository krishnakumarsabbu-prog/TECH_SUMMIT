import type { QuizQuestion } from '../types';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const CATEGORY_ICONS: Record<string, string> = {
  'Artificial Intelligence': '🤖',
  'Generative AI': '🤖',
  'Cloud': '☁️',
  'Cloud Native': '☁️',
  'Cybersecurity': '🛡️',
  'Security': '🛡️',
  'Data Engineering': '📊',
  'Data': '📊',
  'DevOps': '⚡',
  'Architecture': '🏛️',
  'IoT': '📡',
  'Web3': '🔗',
  'Quantum': '⚛️',
};

function getCategoryIcon(category: string): string {
  const match = Object.keys(CATEGORY_ICONS).find((k) =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return match ? CATEGORY_ICONS[match] : '💡';
}

export function QuestionCard({ question, selectedIndex, onSelect }: QuestionCardProps) {
  const icon = getCategoryIcon(question.category);

  return (
    <div className="ts-question-card">
      <div className="ts-question-card__category">
        <span className="ts-question-card__category-icon" aria-hidden="true">{icon}</span>
        <span>{question.category}</span>
      </div>

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
              <span className="ts-option__letter" aria-hidden="true">
                {LETTERS[idx]}
              </span>
              <span className="ts-option__text">{option}</span>
              <span className="ts-option__radio-indicator" aria-hidden="true">
                {selected ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="ts-option__radio-dot" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

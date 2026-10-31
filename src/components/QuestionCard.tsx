import type { QuizQuestion } from '../types';
import {
  BotIcon,
  CloudIcon,
  ShieldIcon,
  ZapIcon,
  BrainIcon,
  TrendingUpIcon,
  LandmarkIcon,
  ServerIcon,
  RocketIcon,
  SparklesIcon,
} from './Icons';
import { playAnswerSound } from '../utils/qrHelper';

interface QuestionCardProps {
  question: QuizQuestion;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function renderCategoryIcon(category: string) {
  const c = (category || '').toLowerCase();
  if (c.includes('agent') || c.includes('identity')) return <BotIcon size={16} />;
  if (c.includes('cloud')) return <CloudIcon size={16} />;
  if (c.includes('security') || c.includes('governance')) return <ShieldIcon size={16} />;
  if (c.includes('software') || c.includes('dev')) return <ZapIcon size={16} />;
  if (c.includes('intelligence') || c.includes('ai platform')) return <BrainIcon size={16} />;
  if (c.includes('business') || c.includes('data')) return <TrendingUpIcon size={16} />;
  if (c.includes('bank') || c.includes('risk')) return <LandmarkIcon size={16} />;
  if (c.includes('sre') || c.includes('platform')) return <ServerIcon size={16} />;
  if (c.includes('quality') || c.includes('ci/cd') || c.includes('engineering')) return <RocketIcon size={16} />;
  return <SparklesIcon size={16} />;
}

export function QuestionCard({ question, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div className="ts-question-card">
      <div className="ts-question-card__category">
        <span className="ts-question-card__category-icon" aria-hidden="true">
          {renderCategoryIcon(question.category)}
        </span>
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
              onClick={() => {
                playAnswerSound();
                onSelect(idx);
              }}
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

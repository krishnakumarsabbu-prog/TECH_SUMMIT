import type { QuizQuestion } from '../types';

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface ShuffledQuestion extends QuizQuestion {
  originalCorrectAnswer: string;
}

export function prepareQuestions(allQuestions: QuizQuestion[], count: number): ShuffledQuestion[] {
  const selected = shuffleArray(allQuestions).slice(0, count);
  return selected.map((q) => {
    const correctText = q.options[q.correctAnswer];
    const shuffledOptions = shuffleArray(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);
    return {
      ...q,
      options: shuffledOptions,
      correctAnswer: newCorrectIndex,
      originalCorrectAnswer: correctText,
    };
  });
}

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

export function prepareQuestions(allQuestions: QuizQuestion[], count: number = 5): ShuffledQuestion[] {
  // Deduplicate: games by id (many share same question text), MCQs by question text
  const seenSignatures = new Set<string>();
  const uniquePool: QuizQuestion[] = [];
  for (const q of allQuestions) {
    const sig = q.itemType === 'game'
      ? q.id  // Games dedupe by id since many templates share the same title
      : (q.question || '').trim().toLowerCase();
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniquePool.push(q);
    }
  }

  const games = uniquePool.filter((q) => q.itemType === 'game');
  const mcqs = uniquePool.filter((q) => q.itemType !== 'game');

  // NEW PATTERN: 3 MCQs + 2 Games (was 2 MCQs + 3 Games)
  let selectedMcqs = shuffleArray(mcqs).slice(0, 3);
  let selectedGames = shuffleArray(games).slice(0, 2);

  // If pool didn't have enough MCQs, fill remainder with games
  if (selectedMcqs.length < 3 && selectedGames.length > 0) {
    const extraNeeded = 3 - selectedMcqs.length;
    const remainingGames = games.filter((g) => !selectedGames.includes(g));
    selectedGames = [...selectedGames, ...shuffleArray(remainingGames).slice(0, extraNeeded)];
  }

  // If pool didn't have enough games, fill remainder with MCQs
  if (selectedGames.length < 2 && selectedMcqs.length > 0) {
    const extraNeeded = 2 - selectedGames.length;
    const remainingMcqs = mcqs.filter((m) => !selectedMcqs.includes(m));
    selectedMcqs = [...selectedMcqs, ...shuffleArray(remainingMcqs).slice(0, extraNeeded)];
  }

  // Combine selected MCQs and Games, then shuffle the 5 items so order is randomized
  const combined = shuffleArray([...selectedMcqs, ...selectedGames]).slice(0, count);

  return combined.map((q) => {
    if (q.itemType === 'game') {
      const opts = q.options && q.options.length > 0 ? q.options : ['Challenge Incomplete', 'Challenge Completed! 🎉'];
      return {
        ...q,
        options: opts,
        correctAnswer: q.correctAnswer ?? 1,
        originalCorrectAnswer: opts[q.correctAnswer ?? 1] || 'Challenge Completed! 🎉',
      };
    }

    const correctText = q.options[q.correctAnswer] ?? q.options[0];
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


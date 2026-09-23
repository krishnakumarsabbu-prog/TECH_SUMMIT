import { useCallback, useEffect, useState } from 'react';
import type { AppStage, Participant, QuizState, QuizResult } from './types';
import questionsData from './data/questions.json';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { ParticipantDetails } from './pages/ParticipantDetails';
import { Quiz } from './pages/Quiz';
import { Results } from './pages/Results';
import { AlreadyPlayed } from './pages/AlreadyPlayed';
import { Button } from './components/Button';
import { prepareQuestions } from './utils/quiz';
import { TIMER_DURATION_SECONDS } from './utils/timer';
import { submitResult } from './services/submissionService';
import {
  getParticipant,
  saveParticipant,
  getQuizState,
  saveQuizState,
  clearQuizState,
  markPlayed,
  hasPlayed,
  getResult,
  saveResult,
  resetAll,
  isTestMode,
  KEYS,
} from './utils/storage';

const QUESTION_COUNT = 5;

export default function App() {
  const [stage, setStage] = useState<AppStage>('WELCOME');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    setTestMode(isTestMode());

    if (hasPlayed()) {
      setStage('ALREADY_PLAYED');
      setResult(getResult());
      const raw = localStorage.getItem(KEYS.RESULT);
      // completedAt is not separately stored; derive from result existence
      setCompletedAt(raw ? new Date().toISOString() : null);
      return;
    }

    const savedQuiz = getQuizState();
    if (savedQuiz) {
      setQuizState(savedQuiz);
      setStage('QUIZ');
      return;
    }

    const savedParticipant = getParticipant();
    if (savedParticipant) {
      setParticipant(savedParticipant);
      setStage('PARTICIPANT');
      return;
    }

    setStage('WELCOME');
  }, []);

  const handleStart = useCallback(() => {
    if (hasPlayed()) {
      setStage('ALREADY_PLAYED');
      return;
    }
    setStage('PARTICIPANT');
  }, []);

  const handleParticipantContinue = useCallback((p: Participant) => {
    setParticipant(p);
    saveParticipant(p);
    // Create fresh quiz
    try {
      const prepared = prepareQuestions(questionsData as QuizState['questions'], QUESTION_COUNT);
      const newQuiz: QuizState = {
        questions: prepared,
        answers: new Array(QUESTION_COUNT).fill(null),
        currentIndex: 0,
        startTime: Date.now(),
        endTime: null,
        submitted: false,
      };
      setQuizState(newQuiz);
      saveQuizState(newQuiz);
      setStage('QUIZ');
    } catch {
      setLoadError('Unable to load the question bank. Please refresh the page.');
    }
  }, []);

  const handleAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setQuizState((prev) => {
      if (!prev) return prev;
      const answers = [...prev.answers];
      answers[questionIndex] = answerIndex;
      const updated = { ...prev, answers };
      saveQuizState(updated);
      return updated;
    });
  }, []);

  const handleNext = useCallback(() => {
    setQuizState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1) };
      saveQuizState(updated);
      return updated;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setQuizState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, currentIndex: Math.max(prev.currentIndex - 1, 0) };
      saveQuizState(updated);
      return updated;
    });
  }, []);

  const computeResult = useCallback((qs: QuizState): QuizResult => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    qs.questions.forEach((q, idx) => {
      const sel = qs.answers[idx];
      if (sel === null || sel === undefined) {
        unanswered++;
      } else if (sel === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });
    const endTime = qs.endTime ?? Date.now();
    const timeTaken = Math.min(
      TIMER_DURATION_SECONDS,
      Math.floor((endTime - qs.startTime) / 1000),
    );
    const total = qs.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      score: correct,
      totalQuestions: total,
      percentage,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      unansweredAnswers: unanswered,
      timeTakenSeconds: timeTaken,
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setDownloadError(null);

    setQuizState((prev) => {
      if (!prev) return prev;
      const endTime = Date.now();
      const updated = { ...prev, endTime, submitted: true };
      saveQuizState(updated);
      return updated;
    });

    // Use the latest state via a microtask to ensure state is set
    setTimeout(async () => {
      // Read from storage to get the persisted submitted state
      const persisted = getQuizState();
      if (!persisted || !participant) {
        setSubmitting(false);
        setDownloadError('Unable to complete submission. Please try again.');
        return;
      }

      const computedResult = computeResult(persisted);
      setResult(computedResult);
      saveResult(computedResult);
      setCompletedAt(new Date().toISOString());

      try {
        await submitResult(participant, persisted, computedResult);
      } catch {
        setDownloadError('Your score was recorded, but the JSON file could not be downloaded automatically. Your attempt is still saved.');
      }

      markPlayed();
      clearQuizState();
      setStage('RESULT');
      setSubmitting(false);
    }, 50);
  }, [submitting, participant, computeResult]);

  const handleDone = useCallback(() => {
    setStage('ALREADY_PLAYED');
    setResult(getResult());
  }, []);

  const handleReset = useCallback(() => {
    resetAll();
    setParticipant(null);
    setQuizState(null);
    setResult(null);
    setCompletedAt(null);
    setDownloadError(null);
    setStage('WELCOME');
  }, []);

  return (
    <>
      <Header />
      <Layout>
        {loadError && (
          <div className="ts-page">
            <div className="ts-page__container">
              <p className="ts-error-message">{loadError}</p>
            </div>
          </div>
        )}

        {!loadError && stage === 'WELCOME' && (
          <Welcome onStart={handleStart} onResume={() => setStage('QUIZ')} hasSavedQuiz={!!getQuizState()} />
        )}

        {!loadError && stage === 'PARTICIPANT' && (
          <ParticipantDetails
            initialData={participant}
            onContinue={handleParticipantContinue}
            onBack={() => setStage('WELCOME')}
          />
        )}

        {!loadError && stage === 'QUIZ' && quizState && (
          <Quiz
            quizState={quizState}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onPrev={handlePrev}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}

        {!loadError && stage === 'RESULT' && result && (
          <Results result={result} onDone={handleDone} downloadError={downloadError} />
        )}

        {!loadError && stage === 'ALREADY_PLAYED' && (
          <AlreadyPlayed result={result ?? getResult()} completedAt={completedAt} onDone={() => {}} />
        )}

        {testMode && (
          <div className="ts-test-mode">
            <Button variant="ghost" onClick={handleReset}>RESET PARTICIPATION</Button>
          </div>
        )}
      </Layout>
    </>
  );
}

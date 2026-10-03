import { useCallback, useEffect, useState } from 'react';
import type { AppStage, Participant, QuizState, QuizResult, BoothConfig, BoothResult } from './types';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { ParticipantDetails } from './pages/ParticipantDetails';
import { Quiz } from './pages/Quiz';
import { Results } from './pages/Results';
import { AlreadyPlayed } from './pages/AlreadyPlayed';
import { Passport } from './pages/Passport';
import { Button } from './components/Button';
import { prepareQuestions } from './utils/quiz';
import { submitResult } from './services/submissionService';
import {
  getParticipant,
  saveParticipant,
  getQuizState,
  saveQuizState,
  clearQuizState,
  getBoothResults,
  saveBoothResult,
  getBoothResult,
  hasPlayedBooth,
  resetAll,
  isTestMode,
  getBoothParamFromUrl,
} from './utils/storage';
import { getBoothById, BOOTHS, REQUIRED_BOOTHS_TO_WIN } from './data/boothsConfig';

const QUESTION_COUNT = 5;

export default function App() {
  const [stage, setStage] = useState<AppStage>('WELCOME');
  const [prevStage, setPrevStage] = useState<AppStage>('WELCOME');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [targetBooth, setTargetBooth] = useState<BoothConfig | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentBoothResult, setCurrentBoothResult] = useState<BoothResult | null>(null);
  const [boothResults, setBoothResults] = useState<Record<string, BoothResult>>({});
  const [submitting, setSubmitting] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize and route based on URL and stored state
  useEffect(() => {
    setTestMode(isTestMode());

    const savedParticipant = getParticipant();
    if (savedParticipant) {
      setParticipant(savedParticipant);
    }

    const savedResults = getBoothResults();
    setBoothResults(savedResults);

    // Check for unfinished saved quiz
    const savedQuiz = getQuizState();
    if (savedQuiz && savedQuiz.questions && savedQuiz.questions.length > 0) {
      setQuizState(savedQuiz);
      const b = getBoothById(savedQuiz.boothId);
      if (b) setTargetBooth(b);
      setStage('QUIZ');
      return;
    }

    // Check URL parameters for booth targeting
    const boothParam = getBoothParamFromUrl();
    const matchedBooth = getBoothById(boothParam);

    if (matchedBooth) {
      setTargetBooth(matchedBooth);

      // Check if user is registered
      if (!savedParticipant) {
        // Unregistered: prompt registration first
        setStage('PARTICIPANT');
        return;
      }

      // User is registered: check if they already completed this booth
      if (hasPlayedBooth(matchedBooth.id)) {
        setCurrentBoothResult(getBoothResult(matchedBooth.id));
        setStage('ALREADY_PLAYED');
        return;
      }

      // User registered and booth not yet played: launch quiz directly!
      startBoothQuiz(matchedBooth);
      return;
    }

    // If no specific booth in URL:
    // If attendee is registered and has played at least one booth, show their Passport!
    if (savedParticipant && Object.keys(savedResults).length > 0) {
      setStage('PASSPORT');
      return;
    }

    // Otherwise show Welcome screen
    setStage('WELCOME');
  }, []);

  const startBoothQuiz = useCallback((booth: BoothConfig) => {
    try {
      const prepared = prepareQuestions(booth.questions, QUESTION_COUNT);
      const newQuiz: QuizState = {
        boothId: booth.id,
        boothNumber: booth.number,
        boothTitle: booth.title,
        questions: prepared,
        answers: new Array(QUESTION_COUNT).fill(null),
        currentIndex: 0,
        startTime: Date.now(),
        endTime: null,
        submitted: false,
      };
      setQuizState(newQuiz);
      saveQuizState(newQuiz);
      setTargetBooth(booth);
      setStage('QUIZ');
    } catch {
      setLoadError(`Unable to load questions for ${booth.title}. Please refresh.`);
    }
  }, []);

  const handleStartFromWelcome = useCallback(() => {
    const booth = targetBooth || BOOTHS[0];
    if (!participant) {
      setTargetBooth(booth);
      setStage('PARTICIPANT');
      return;
    }

    if (hasPlayedBooth(booth.id)) {
      setCurrentBoothResult(getBoothResult(booth.id));
      setStage('ALREADY_PLAYED');
      return;
    }

    startBoothQuiz(booth);
  }, [targetBooth, participant, startBoothQuiz]);

  const handleParticipantRegister = useCallback((p: Participant) => {
    setParticipant(p);
    saveParticipant(p);

    // If an active booth was scanned, seamlessly launch its quiz!
    const booth = targetBooth || BOOTHS[0];
    startBoothQuiz(booth);
  }, [targetBooth, startBoothQuiz]);

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
    const timeTaken = Math.min(60, Math.floor((endTime - qs.startTime) / 1000));
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

    setTimeout(async () => {
      const persisted = getQuizState();
      if (!persisted || !participant) {
        setSubmitting(false);
        setDownloadError('Unable to complete submission. Please try again.');
        return;
      }

      const computedResult = computeResult(persisted);
      setResult(computedResult);

      // Save booth result to local multi-booth store
      const answersList = persisted.questions.map((q, idx) => ({
        questionId: q.id,
        selectedAnswer: persisted.answers[idx] !== null && persisted.answers[idx] !== undefined ? q.options[persisted.answers[idx]!] : null,
        correct: persisted.answers[idx] === q.correctAnswer,
      }));

      const newBoothResult: BoothResult = {
        ...computedResult,
        boothId: persisted.boothId,
        boothNumber: persisted.boothNumber,
        boothTitle: persisted.boothTitle,
        completedAt: new Date().toISOString(),
        answers: answersList,
      };

      saveBoothResult(newBoothResult);
      const updatedBoothResults = getBoothResults();
      setBoothResults(updatedBoothResults);
      setCurrentBoothResult(newBoothResult);

      const completedCount = Object.keys(updatedBoothResults).length;

      // Submit to Google Sheets / server
      try {
        await submitResult(participant, persisted, computedResult, completedCount);
      } catch {
        console.warn('Submission recording encountered an issue.');
      }

      clearQuizState();
      setQuizState(null);
      setStage('RESULT');
      setSubmitting(false);
    }, 50);
  }, [submitting, participant, computeResult]);

  const handleOpenPassport = useCallback(() => {
    if (stage === 'PASSPORT') {
      setStage(prevStage || 'WELCOME');
    } else {
      setPrevStage(stage);
      setStage('PASSPORT');
    }
  }, [stage, prevStage]);

  const handleSelectBoothFromPassport = useCallback((boothId: string) => {
    const booth = getBoothById(boothId);
    if (!booth) return;

    if (!participant) {
      setTargetBooth(booth);
      setStage('PARTICIPANT');
      return;
    }

    if (hasPlayedBooth(booth.id)) {
      setCurrentBoothResult(getBoothResult(booth.id));
      setStage('ALREADY_PLAYED');
      return;
    }

    startBoothQuiz(booth);
  }, [participant, startBoothQuiz]);

  const handleReset = useCallback(() => {
    resetAll();
    setParticipant(null);
    setQuizState(null);
    setResult(null);
    setCurrentBoothResult(null);
    setBoothResults({});
    setTargetBooth(null);
    setDownloadError(null);
    setStage('WELCOME');
  }, []);

  const completedCount = Object.keys(boothResults).length;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;

  return (
    <>
      <Header
        completedCount={completedCount}
        isWinner={isWinner}
        onOpenPassport={participant ? handleOpenPassport : undefined}
        isPassportActive={stage === 'PASSPORT'}
      />
      <Layout>
        {loadError && (
          <div className="ts-page">
            <div className="ts-page__container">
              <p className="ts-error-message">{loadError}</p>
            </div>
          </div>
        )}

        {!loadError && stage === 'WELCOME' && (
          <Welcome
            targetBooth={targetBooth}
            participant={participant}
            completedCount={completedCount}
            onStart={handleStartFromWelcome}
            onResume={() => setStage('QUIZ')}
            hasSavedQuiz={!!getQuizState()}
            onOpenPassport={() => setStage('PASSPORT')}
          />
        )}

        {!loadError && stage === 'PARTICIPANT' && (
          <ParticipantDetails
            initialData={participant}
            targetBooth={targetBooth}
            onContinue={handleParticipantRegister}
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
          <Results
            result={result}
            boothTitle={targetBooth?.title}
            boothNumber={targetBooth?.number}
            completedCount={completedCount}
            onDone={() => setStage('PASSPORT')}
            downloadError={downloadError}
          />
        )}

        {!loadError && stage === 'ALREADY_PLAYED' && (
          <AlreadyPlayed
            boothResult={currentBoothResult}
            overallResult={result}
            completedCount={completedCount}
            completedAt={currentBoothResult?.completedAt || null}
            onDone={() => setStage('PASSPORT')}
            onExploreOtherBooths={() => setStage('PASSPORT')}
          />
        )}

        {!loadError && stage === 'PASSPORT' && (
          <Passport
            participant={participant}
            boothResults={boothResults}
            onSelectBooth={handleSelectBoothFromPassport}
            onBackToCurrent={quizState ? () => setStage('QUIZ') : undefined}
            hasActiveQuiz={Boolean(quizState)}
          />
        )}

        {testMode && (
          <div className="ts-test-mode">
            <Button variant="ghost" onClick={handleReset}>
              RESET ALL PARTICIPATION DATA
            </Button>
          </div>
        )}
      </Layout>
    </>
  );
}

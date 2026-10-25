import { useCallback, useEffect, useState } from 'react';
import type { AppStage, Participant, QuizState, QuizResult, BoothConfig, BoothResult, BoothTopic } from './types';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { ParticipantDetails } from './pages/ParticipantDetails';
import { TopicSelection } from './pages/TopicSelection';
import { Quiz } from './pages/Quiz';
import { Results } from './pages/Results';
import { AlreadyPlayed } from './pages/AlreadyPlayed';
import { Passport } from './pages/Passport';
import { Button } from './components/Button';
import { FirebaseStatusModal } from './components/FirebaseStatusModal';
import { prepareQuestions } from './utils/quiz';
import { submitResult, registerParticipant } from './services/submissionService';
import {
  getParticipant,
  saveParticipant,
  getQuizState,
  saveQuizState,
  clearQuizState,
  getBoothResults,
  saveBoothResult,
  saveAllBoothResults,
  getBoothResult,
  hasPlayedBooth,
  resetAll,
  isTestMode,
  getBoothParamFromUrl,
} from './utils/storage';
import { fetchParticipantFromFirestore } from './services/firebaseService';
import { getBoothById, REQUIRED_BOOTHS_TO_WIN } from './data/boothsConfig';

const QUESTION_COUNT = 5;

async function fetchParticipantData(id: string) {
  return fetchParticipantFromFirestore(id);
}

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
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Initialize and route based on URL and stored state
  useEffect(() => {
    setTestMode(isTestMode());

    const savedParticipant = getParticipant();
    if (savedParticipant) {
      setParticipant(savedParticipant);
    }

    const savedResults = getBoothResults();
    setBoothResults(savedResults);

    // Check URL parameters for booth targeting
    const boothParam = getBoothParamFromUrl();
    const matchedBooth = getBoothById(boothParam);

    if (matchedBooth) {
      setTargetBooth(matchedBooth);

      // STRICT RESTRICTION: If already played, immediately display AlreadyPlayed screen with result!
      if (hasPlayedBooth(matchedBooth.id)) {
        setCurrentBoothResult(getBoothResult(matchedBooth.id));
        setStage('ALREADY_PLAYED');
        return;
      }

      // Check for unfinished saved quiz for THIS specific booth
      const savedQuiz = getQuizState();
      if (savedQuiz && savedQuiz.boothId === matchedBooth.id && !savedQuiz.submitted) {
        setQuizState(savedQuiz);
        setStage('QUIZ');
        return;
      }

      // Check if user is registered
      if (!savedParticipant) {
        const urlParams = new URLSearchParams(window.location.search);
        const paramEntId = urlParams.get('entId') || urlParams.get('uuid') || urlParams.get('id');
        if (paramEntId) {
          fetchParticipantData(paramEntId).then((res: any) => {
            if (res.exists && res.participant) {
              setParticipant(res.participant);
              saveParticipant(res.participant);
              if (res.boothResults) {
                setBoothResults(res.boothResults);
                saveAllBoothResults(res.boothResults);
              }
              if (res.boothResults && res.boothResults[matchedBooth.id]) {
                setCurrentBoothResult(res.boothResults[matchedBooth.id]);
                setStage('ALREADY_PLAYED');
              } else {
                setStage('TOPIC_SELECTION');
              }
            } else {
              setStage('PARTICIPANT');
            }
          });
          return;
        }
        // Unregistered: prompt registration first
        setStage('PARTICIPANT');
        return;
      }

      // User registered and booth not yet played: show topic selection!
      setStage('TOPIC_SELECTION');
      return;
    }

    // Check for unfinished saved quiz (when no specific booth param in URL)
    const savedQuiz = getQuizState();
    if (savedQuiz && savedQuiz.questions && savedQuiz.questions.length > 0) {
      if (hasPlayedBooth(savedQuiz.boothId)) {
        clearQuizState();
      } else {
        setQuizState(savedQuiz);
        const b = getBoothById(savedQuiz.boothId);
        if (b) setTargetBooth(b);
        setStage('QUIZ');
        return;
      }
    }

    // If attendee is registered in browser cache, show their Passport directly!
    if (savedParticipant) {
      setStage('PASSPORT');
      return;
    }

    // If incognito/new window has ?entId=... or ?uuid=... in URL, auto-restore from results repository
    const urlParams = new URLSearchParams(window.location.search);
    const paramEntId = urlParams.get('entId') || urlParams.get('uuid') || urlParams.get('id');
    if (paramEntId && !savedParticipant) {
      fetchParticipantData(paramEntId).then((res: any) => {
        if (res.exists && res.participant) {
          setParticipant(res.participant);
          saveParticipant(res.participant);
          if (res.boothResults) {
            setBoothResults(res.boothResults);
            saveAllBoothResults(res.boothResults);
          }
          setStage('PASSPORT');
        }
        // else: stays at initial WELCOME stage — no explicit call needed
      });
      // Do NOT call setStage('WELCOME') here — it would flash WELCOME before async resolves
      return;
    }

    // No params, no cache → show the Innovation Showcase landing page
    // (initial useState value is already 'WELCOME', so no explicit call needed)
  }, []);

  const startBoothQuiz = useCallback((booth: BoothConfig, topic?: BoothTopic) => {
    // Guard: Prevent starting any booth that has already been completed
    if (hasPlayedBooth(booth.id)) {
      setCurrentBoothResult(getBoothResult(booth.id));
      setTargetBooth(booth);
      setStage('ALREADY_PLAYED');
      return;
    }

    try {
      const pool = topic?.questions && topic.questions.length > 0 ? topic.questions : booth.questions;
      const count = Math.min(QUESTION_COUNT, pool.length);
      const prepared = prepareQuestions(pool, count);
      const newQuiz: QuizState = {
        boothId: booth.id,
        boothNumber: booth.number,
        boothTitle: booth.title,
        topicId: topic?.id,
        topicTitle: topic?.title,
        questions: prepared,
        answers: new Array(prepared.length).fill(null),
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

  const handleTopicSelect = useCallback((topic: BoothTopic) => {
    if (!targetBooth) return;
    startBoothQuiz(targetBooth, topic);
  }, [targetBooth, startBoothQuiz]);

  const handleStartFromWelcome = useCallback(() => {
    if (!participant) {
      setStage('PARTICIPANT');
      return;
    }
    setStage('PASSPORT');
  }, [participant]);

  const handleParticipantRegister = useCallback(
    (p: Participant, restoredResults?: Record<string, BoothResult>) => {
      setParticipant(p);
      saveParticipant(p);

      // restoredResults !== undefined means user was found in Firebase (even if they have 0 tests).
      // Only call registerParticipant for truly NEW users (restoredResults is undefined).
      if (restoredResults !== undefined) {
        // Existing user — restore their booth results into browser cache
        if (Object.keys(restoredResults).length > 0) {
          setBoothResults(restoredResults);
          saveAllBoothResults(restoredResults);
          console.log(`[Passport Restore] Restored ${Object.keys(restoredResults).length} booth test(s) for ${p.entId}`);
        } else {
          console.log(`[Passport Restore] Existing user ${p.entId} found in Firebase — 0 tests to restore yet.`);
        }
      } else {
        // Truly new participant — push registration to Firebase Firestore
        registerParticipant(p).catch((err) => {
          console.warn('Registration sync error:', err);
        });
      }

      // If the scanned booth was already completed (in restored results), show AlreadyPlayed
      if (targetBooth && restoredResults && restoredResults[targetBooth.id]) {
        setCurrentBoothResult(restoredResults[targetBooth.id]);
        setStage('ALREADY_PLAYED');
        return;
      }

      // If there's a target booth (from QR scan) and it's not played yet, go straight to quiz
      if (targetBooth) {
        setStage('TOPIC_SELECTION');
        return;
      }

      // No specific booth → show passport so attendee can scan any booth they want
      setStage('PASSPORT');
    },
    [targetBooth],
  );

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
        topicId: persisted.topicId,
        topicTitle: persisted.topicTitle,
        completedAt: new Date().toISOString(),
        answers: answersList,
      };

      saveBoothResult(newBoothResult);
      const updatedBoothResults = getBoothResults();
      setBoothResults(updatedBoothResults);
      setCurrentBoothResult(newBoothResult);

      const completedCount = Object.keys(updatedBoothResults).length;

      // Submit to Firebase Firestore database
      try {
        await submitResult(participant, persisted, computedResult, completedCount, updatedBoothResults);
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

  const handleLaunchBoothFromPassport = useCallback((booth: BoothConfig) => {
    setTargetBooth(booth);
    if (hasPlayedBooth(booth.id)) {
      setCurrentBoothResult(getBoothResult(booth.id));
      setStage('ALREADY_PLAYED');
      return;
    }

    if (!participant) {
      setStage('PARTICIPANT');
      return;
    }

    // Direct user to topic selection screen to choose active 20-minute topic!
    setStage('TOPIC_SELECTION');
  }, [participant]);

  const handleOpenScannedUrl = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const handleReset = useCallback(() => {
    resetAll();
    setParticipant(null);
    setQuizState(null);
    setResult(null);
    setCurrentBoothResult(null);
    setBoothResults({});
    setTargetBooth(null);
    setDownloadError(null);
    setStage('PARTICIPANT');
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
        onGoHome={() => setStage('WELCOME')}
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
            onSelectBooth={handleLaunchBoothFromPassport}
          />
        )}

        {!loadError && stage === 'PARTICIPANT' && (
          <ParticipantDetails
            initialData={participant}
            targetBooth={targetBooth}
            onContinue={handleParticipantRegister}
            onBack={participant ? () => setStage('PASSPORT') : () => setStage('WELCOME')}
          />
        )}

        {!loadError && stage === 'TOPIC_SELECTION' && targetBooth && (
          <TopicSelection
            booth={targetBooth}
            onSelectTopic={handleTopicSelect}
            onBack={() => setStage('PASSPORT')}
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
            onBackToCurrent={quizState ? () => setStage('QUIZ') : undefined}
            hasActiveQuiz={Boolean(quizState)}
            onLaunchBooth={handleLaunchBoothFromPassport}
            onOpenUrl={handleOpenScannedUrl}
            onEditProfile={() => setStage('PARTICIPANT')}
          />
        )}


        {testMode && (
          <div className="ts-test-mode" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={handleReset}>
              RESET ALL PARTICIPATION DATA
            </Button>
            <Button variant="ghost" onClick={() => setIsFirebaseModalOpen(true)}>
              🔥 FIREBASE STATUS
            </Button>
          </div>
        )}

        <FirebaseStatusModal
          isOpen={isFirebaseModalOpen}
          onClose={() => setIsFirebaseModalOpen(false)}
          currentEntId={participant?.entId}
        />
      </Layout>
    </>
  );
}

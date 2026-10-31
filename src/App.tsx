import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { AppStage, Participant, QuizState, QuizResult, BoothConfig, BoothResult, BoothTopic } from './types';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { ConfettiCelebration } from './components/ConfettiCelebration';
const Welcome = lazy(() => import('./pages/Welcome').then((module) => ({ default: module.Welcome })));
const ParticipantDetails = lazy(() => import('./pages/ParticipantDetails').then((module) => ({ default: module.ParticipantDetails })));
const TopicSelection = lazy(() => import('./pages/TopicSelection').then((module) => ({ default: module.TopicSelection })));
const Quiz = lazy(() => import('./pages/Quiz').then((module) => ({ default: module.Quiz })));
const Results = lazy(() => import('./pages/Results').then((module) => ({ default: module.Results })));
const AlreadyPlayed = lazy(() => import('./pages/AlreadyPlayed').then((module) => ({ default: module.AlreadyPlayed })));
const Passport = lazy(() => import('./pages/Passport').then((module) => ({ default: module.Passport })));
const FirebaseStatusModal = lazy(() => import('./components/FirebaseStatusModal').then((module) => ({ default: module.FirebaseStatusModal })));
import { prepareQuestions } from './utils/quiz';
import {
  getParticipant,
  saveParticipant,
  getQuizState,
  saveQuizState,
  clearQuizState,
  getBoothResults,
  migrateLegacyBoothResults,
  saveBoothResult,
  saveAllBoothResults,
  resetAll,
  isTestMode,
  getBoothParamFromUrl,
} from './utils/storage';
import { getBoothById, MAX_BOOTHS_PER_PARTICIPANT, REQUIRED_BOOTHS_TO_WIN } from './data/boothsConfig';
import { loadBoothQuestions } from './utils/questionEngine';

const QUESTION_COUNT = 5;

async function fetchParticipantData(id: string) {
  const { fetchParticipantFromFirestore } = await import('./services/firebaseService');
  return fetchParticipantFromFirestore(id);
}

function quizBelongsToParticipant(quiz: QuizState, participant: Participant | null): boolean {
  return Boolean(
    participant?.email &&
    quiz.participantEmail.trim().toLowerCase() === participant.email.trim().toLowerCase(),
  );
}

const FUN_GAMES = new Set([
  'memory_missing', 'grid_tap', 'odd_one', 'pair_match',
  'sequence', 'timer_stop', 'luck_pick', 'sort_bucket',
  'pattern_quiz', 'crowd_judge'
]);

function isStaleQuiz(sq: QuizState): boolean {
  const games = sq.questions.filter(q => q.itemType === 'game');
  const mcqs = sq.questions.filter(q => q.itemType !== 'game');
  return mcqs.length !== 3 || games.length !== 2 || games.some(g => !FUN_GAMES.has(g.gameType as string));
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
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!participant?.email) return;

    const retryPending = () => {
      void import('./services/submissionService')
        .then(({ retryPendingSubmissions }) => retryPendingSubmissions(participant.email))
        .catch((error: unknown) => {
          console.warn('[Submission] Unable to load pending submission sync:', error);
        });
    };
    retryPending();
    window.addEventListener('online', retryPending);
    return () => window.removeEventListener('online', retryPending);
  }, [participant?.email]);

  // Initialize and route based on URL and stored state
  useEffect(() => {
    setTestMode(isTestMode());

    const savedParticipant = getParticipant();
    if (savedParticipant) {
      // Older builds kept one unscoped result cache. Only migrate it when this
      // browser already has the participant identity that owned that cache.
      migrateLegacyBoothResults(savedParticipant.email);
      setParticipant(savedParticipant);
    }

    const savedResults = getBoothResults(savedParticipant?.email);
    setBoothResults(savedResults);

    // Check URL parameters for booth targeting
    const boothParam = getBoothParamFromUrl();
    const matchedBooth = getBoothById(boothParam);

    if (matchedBooth) {
      setTargetBooth(matchedBooth);

      // STRICT RESTRICTION: If already played, immediately display AlreadyPlayed screen with result!
      if (savedResults[matchedBooth.id]) {
        setCurrentBoothResult(savedResults[matchedBooth.id]);
        setStage('ALREADY_PLAYED');
        return;
      }

      // Check for unfinished saved quiz for THIS specific booth
      const savedQuiz = getQuizState();
      if (savedQuiz && (!quizBelongsToParticipant(savedQuiz, savedParticipant) || isStaleQuiz(savedQuiz))) {
        clearQuizState();
      } else if (savedQuiz && savedQuiz.boothId === matchedBooth.id && !savedQuiz.submitted) {
        if (Object.keys(savedResults).length >= MAX_BOOTHS_PER_PARTICIPANT) {
          setStage('PASSPORT');
          return;
        }
        setQuizState(savedQuiz);
        setStage('QUIZ');
        return;
      }

      // Check if user is registered
      if (!savedParticipant) {
        const urlParams = new URLSearchParams(window.location.search);
        const paramEntId = urlParams.get('entId') || urlParams.get('uuid') || urlParams.get('id');
        if (paramEntId) {
          fetchParticipantData(paramEntId).then((res) => {
            if (res.error) {
              console.warn('[Participant restore] Firebase lookup failed:', res.error);
              setLoadError('We could not restore this passport from Firebase. Please check your connection and refresh to retry.');
              return;
            }

            if (res.exists && res.participant) {
              setParticipant(res.participant);
              saveParticipant(res.participant);
              if (res.boothResults) {
                setBoothResults(res.boothResults);
                saveAllBoothResults(res.boothResults, res.participant.email);
              }
              if (res.boothResults && res.boothResults[matchedBooth.id]) {
                setCurrentBoothResult(res.boothResults[matchedBooth.id]);
                setStage('ALREADY_PLAYED');
              } else {
                startBoothQuiz(matchedBooth, undefined, res.participant.email);
              }
            } else {
              setStage('PARTICIPANT');
            }
          }).catch((error: unknown) => {
            console.warn('[Participant restore] Firebase lookup failed:', error);
            setLoadError('We could not restore this passport from Firebase. Please check your connection and refresh to retry.');
          });
          return;
        }
        // Unregistered: prompt registration first
        setStage('PARTICIPANT');
        return;
      }

      // User registered and booth not yet played: start quiz directly!
      startBoothQuiz(matchedBooth, undefined, savedParticipant.email);
      return;
    }

    // Check for unfinished saved quiz (when no specific booth param in URL)
    const savedQuiz = getQuizState();
    if (savedQuiz && (!quizBelongsToParticipant(savedQuiz, savedParticipant) || isStaleQuiz(savedQuiz))) {
      clearQuizState();
    } else if (savedQuiz && !savedQuiz.submitted && savedQuiz.questions.length > 0) {
      if (savedResults[savedQuiz.boothId]) {
        clearQuizState();
      } else if (Object.keys(savedResults).length >= MAX_BOOTHS_PER_PARTICIPANT) {
        clearQuizState();
        setStage('PASSPORT');
        return;
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
      fetchParticipantData(paramEntId).then((res) => {
        if (res.error) {
          console.warn('[Participant restore] Firebase lookup failed:', res.error);
          setLoadError('We could not restore this passport from Firebase. Please check your connection and refresh to retry.');
          return;
        }

        if (res.exists && res.participant) {
          setParticipant(res.participant);
          saveParticipant(res.participant);
          if (res.boothResults) {
            setBoothResults(res.boothResults);
            saveAllBoothResults(res.boothResults, res.participant.email);
          }
          setStage('PASSPORT');
        }
        // else: stays at initial WELCOME stage — no explicit call needed
      }).catch((error: unknown) => {
        console.warn('[Participant restore] Firebase lookup failed:', error);
        setLoadError('We could not restore this passport from Firebase. Please check your connection and refresh to retry.');
      });
      // Do NOT call setStage('WELCOME') here — it would flash WELCOME before async resolves
      return;
    }

    // No params, no cache → show the Innovation Showcase landing page
    // (initial useState value is already 'WELCOME', so no explicit call needed)
  }, []);

  const startBoothQuiz = useCallback(async (booth: BoothConfig, topic?: BoothTopic, participantEmail = participant?.email) => {
    if (!participantEmail) {
      setTargetBooth(booth);
      setStage('PARTICIPANT');
      return;
    }

    const participantResults = getBoothResults(participantEmail);

    // Guard: Prevent starting any booth that has already been completed
    if (participantResults[booth.id]) {
      setCurrentBoothResult(participantResults[booth.id]);
      setTargetBooth(booth);
      setStage('ALREADY_PLAYED');
      return;
    }

    if (Object.keys(participantResults).length >= MAX_BOOTHS_PER_PARTICIPANT) {
      setStage('PASSPORT');
      return;
    }

    try {
      // Dynamic non-repeating draw across 1,000+ players (2,000 MCQs + 3,000 Games)
      const dynamicPool = await loadBoothQuestions(booth.id, participantEmail);
      const pool = dynamicPool.length > 0 ? dynamicPool : (topic?.questions && topic.questions.length > 0 ? topic.questions : booth.questions);
      const count = Math.min(QUESTION_COUNT, pool.length);
      const prepared = prepareQuestions(pool, count);
      const newQuiz: QuizState = {
        participantEmail,
        boothId: booth.id,
        boothNumber: booth.number,
        boothTitle: booth.title,
        topicId: topic?.id,
        topicTitle: topic?.title || booth.title,
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
  }, [participant?.email]);

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
      const activeQuiz = getQuizState();
      const identityChanged = Boolean(
        participant?.email &&
        participant.email.trim().toLowerCase() !== p.email.trim().toLowerCase(),
      );
      if (identityChanged || (activeQuiz && !quizBelongsToParticipant(activeQuiz, p))) {
        clearQuizState();
        setQuizState(null);
      }
      if (identityChanged) {
        setResult(null);
        setCurrentBoothResult(null);
        setTargetBooth(null);
      }

      setParticipant(p);
      saveParticipant(p);
      const participantResults = {
        ...getBoothResults(p.email),
        ...(restoredResults ?? {}),
      };
      setBoothResults(participantResults);

      // restoredResults !== undefined means user was found in Firebase (even if they have 0 tests).
      if (restoredResults !== undefined) {
        // Existing user — restore their booth results into browser cache
        if (Object.keys(restoredResults).length > 0) {
          saveAllBoothResults(participantResults, p.email);
          console.log(`[Passport Restore] Restored ${Object.keys(restoredResults).length} booth test(s) for ${p.entId}`);
        } else {
          console.log(`[Passport Restore] Existing user ${p.entId} found in Firebase — 0 tests to restore yet.`);
        }
      }

      // If the scanned booth was already completed (in restored results), show AlreadyPlayed
      if (!identityChanged && targetBooth && restoredResults && restoredResults[targetBooth.id]) {
        setCurrentBoothResult(restoredResults[targetBooth.id]);
        setStage('ALREADY_PLAYED');
        return;
      }

      // If there's a target booth (from QR scan) and it's not played yet, go straight to quiz!
      if (targetBooth && !identityChanged) {
        startBoothQuiz(targetBooth, undefined, p.email);
        return;
      }

      // No specific booth → show passport so attendee can scan any booth they want
      setStage('PASSPORT');
    },
    [participant?.email, targetBooth, startBoothQuiz],
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
      const targetCorrect = q.correctAnswer !== undefined ? q.correctAnswer : (q.gameData?.bugLineIndex ?? 0);
      if (sel === null || sel === undefined) {
        unanswered++;
      } else if (sel === targetCorrect) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const endTime = qs.endTime ?? Date.now();
    const timeTaken = Math.min(90, Math.floor((endTime - qs.startTime) / 1000));
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
        selectedAnswer: persisted.answers[idx] !== null && persisted.answers[idx] !== undefined ? (q.options ? q.options[persisted.answers[idx]!] : `Line ${persisted.answers[idx]! + 1}`) : null,
        correct: persisted.answers[idx] === (q.correctAnswer !== undefined ? q.correctAnswer : (q.gameData?.bugLineIndex ?? 0)),
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

      saveBoothResult(newBoothResult, participant.email);
      const updatedBoothResults = getBoothResults(participant.email);
      setBoothResults(updatedBoothResults);
      setCurrentBoothResult(newBoothResult);

      const completedCount = Object.keys(updatedBoothResults).length;
      if (completedCount >= REQUIRED_BOOTHS_TO_WIN) {
        setShowCelebration(true);
      }

      // Submit to Firebase Firestore database - hold on until record is saved to Firebase
      try {
        const { submitResult } = await import('./services/submissionService');
        await Promise.all([
          submitResult(participant, persisted, computedResult, completedCount, (status) => {
            setDownloadError(null);
            if (status === 'synced') {
              console.log('[Firebase] Result synced successfully.');
            } else {
              console.warn('[Firebase] Status:', status);
            }
          }),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
      } catch (err) {
        console.warn('Submission recording encountered an issue:', err);
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
    if (!participant) {
      setStage('PARTICIPANT');
      return;
    }

    const participantResults = getBoothResults(participant.email);
    if (participantResults[booth.id]) {
      setCurrentBoothResult(participantResults[booth.id]);
      setStage('ALREADY_PLAYED');
      return;
    }

    if (Object.keys(participantResults).length >= MAX_BOOTHS_PER_PARTICIPANT) {
      setStage('PASSPORT');
      return;
    }

    // Immediately start the booth quiz!
    startBoothQuiz(booth, undefined, participant.email);
  }, [participant, startBoothQuiz]);

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
  const savedQuiz = getQuizState();
  const canResumeQuiz = Boolean(savedQuiz && !savedQuiz.submitted && quizBelongsToParticipant(savedQuiz, participant));

  return (
    <>
      {showCelebration && <ConfettiCelebration onComplete={() => setShowCelebration(false)} />}
      {((stage !== 'WELCOME' && stage !== 'PASSPORT' && stage !== 'QUIZ' && stage !== 'RESULT' && stage !== 'PARTICIPANT' && stage !== 'ALREADY_PLAYED') || loadError) && (
        <Header
          completedCount={completedCount}
          isWinner={isWinner}
          onOpenPassport={participant ? handleOpenPassport : undefined}
          isPassportActive={stage === 'PASSPORT'}
        />
      )}
      <Layout wide={stage === 'WELCOME' && !loadError} showBanner={stage === 'WELCOME'}>
        {loadError && (
          <div className="ts-page">
            <div className="ts-page__container">
              <p className="ts-error-message">{loadError}</p>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="ts-page"><p className="ts-page__description">Loading…</p></div>}>
        {!loadError && stage === 'WELCOME' && (
          <Welcome
            targetBooth={targetBooth}
            participant={participant}
            completedCount={completedCount}
            onStart={handleStartFromWelcome}
            onResume={() => {
              const quiz = getQuizState();
              if (!quiz || quiz.submitted || !quizBelongsToParticipant(quiz, participant)) return;
              setQuizState(quiz);
              setTargetBooth(getBoothById(quiz.boothId));
              setStage('QUIZ');
            }}
            hasSavedQuiz={canResumeQuiz}
            onOpenPassport={handleStartFromWelcome}
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
            hasReachedBoothLimit={completedCount >= MAX_BOOTHS_PER_PARTICIPANT}
            onBackToCurrent={quizState ? () => setStage('QUIZ') : undefined}
            hasActiveQuiz={Boolean(quizState)}
            onLaunchBooth={handleLaunchBoothFromPassport}
            onOpenUrl={handleOpenScannedUrl}
            onEditProfile={() => setStage('PARTICIPANT')}
            onGoHome={() => setStage('WELCOME')}
          />
        )}
        </Suspense>

        {testMode && (
          <div className="ts-test-mode" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={handleReset}>
              RESET ALL PARTICIPATION DATA
            </Button>
            <Button variant="ghost" onClick={() => setIsFirebaseModalOpen(true)}>
              FIREBASE STATUS
            </Button>
          </div>
        )}

        <Suspense fallback={null}>
          {isFirebaseModalOpen && (
            <FirebaseStatusModal
              isOpen={isFirebaseModalOpen}
              onClose={() => setIsFirebaseModalOpen(false)}
              currentParticipantEmail={participant?.email}
            />
          )}
        </Suspense>
        </Layout>
    </>
  );
}

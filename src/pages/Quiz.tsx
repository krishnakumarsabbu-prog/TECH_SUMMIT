import { useCallback, useState, useEffect } from 'react';
import type { QuizState } from '../types';
import { getRemainingSeconds, getTimerPhase } from '../utils/timer';
import { playAnswerSound } from '../utils/qrHelper';
import { AppStickyHeader } from '../components/AppStickyHeader';
import { GameRunner } from '../components/games/GameRunner';

interface QuizProps {
  quizState: QuizState;
  onAnswer: (questionIndex: number, answerIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function cleanBoothName(boothTitle: string): string {
  const parts = boothTitle.split('•').map((s) => s.trim());
  return parts[0] || boothTitle || 'TECHNOLOGY CHALLENGE';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function Quiz({ quizState, onAnswer, onNext, onPrev, onSubmit, submitting }: QuizProps) {
  const [endTime, setEndTime] = useState<number | null>(quizState.endTime);
  const [expired, setExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(quizState.startTime, quizState.endTime));

  const currentIndex = quizState.currentIndex;
  const question = quizState.questions[currentIndex];
  const isLast = currentIndex === quizState.questions.length - 1;

  // Selected answer index for current question (restore if previously chosen)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(() => {
    return quizState.answers[currentIndex] ?? null;
  });

  // Sync selected answer when currentIndex changes
  useEffect(() => {
    setSelectedIdx(quizState.answers[currentIndex] ?? null);
  }, [currentIndex, quizState.answers]);

  const handleExpire = useCallback(() => {
    if (expired || submitting) return;
    setExpired(true);
    setEndTime(Date.now());
    onSubmit();
  }, [expired, submitting, onSubmit]);

  // Overall Countdown Timer (90 seconds)
  useEffect(() => {
    if (endTime !== null) {
      setRemainingSeconds(getRemainingSeconds(quizState.startTime, endTime));
      return;
    }
    const interval = setInterval(() => {
      const r = getRemainingSeconds(quizState.startTime, null);
      setRemainingSeconds(r);
      if (r <= 0) {
        clearInterval(interval);
        handleExpire();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [quizState.startTime, endTime, handleExpire]);

  if (!question) {
    return (
      <div className="app-screen">
        <div className="app-card">
          <p className="app-card-subtitle">Unable to load quiz questions. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const isGame = question.itemType === 'game';
  const totalQuestions = quizState.questions.length;
  const timerPhase = getTimerPhase(remainingSeconds);

  // Parse title and instruction
  const rawQuestionText = question.question || '';
  let displayTitle = '';
  let displayInstruction = '';

  if (rawQuestionText.includes(':')) {
    const colonIdx = rawQuestionText.indexOf(':');
    displayTitle = rawQuestionText.slice(0, colonIdx).trim();
    displayInstruction = rawQuestionText.slice(colonIdx + 1).trim();
  } else {
    displayTitle = rawQuestionText.trim();
    displayInstruction = isGame
      ? 'Complete the mini-game challenge below!'
      : 'Select the best answer from the options below.';
  }

  const handleSelectOption = (idx: number) => {
    playAnswerSound();
    setSelectedIdx(idx);
    onAnswer(currentIndex, idx);
  };

  const handleProceed = () => {
    if (selectedIdx === null || submitting || expired) return;
    if (isLast) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <div className="app-screen" role="main">
      {/* 1. Universal Sticky Banner Header */}
      <AppStickyHeader />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
        {/* Booth Context Bar with 90s Countdown Timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--app-primary)' }}>
              BOOTH {quizState.boothNumber || 1} • {cleanBoothName(quizState.boothTitle || '')}
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--app-text-muted)' }}>
              Question {currentIndex + 1} of {totalQuestions}
            </div>
          </div>

          {/* 90s Timer Badge */}
          <div
            className={`app-timer-badge ${timerPhase === 'critical' || remainingSeconds <= 15 ? 'app-timer-badge--urgent' : ''}`}
            aria-live="polite"
            aria-label={`Time remaining: ${remainingSeconds} seconds`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{remainingSeconds}s</span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div
          className="app-segmented-progress"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
        >
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`app-segment ${i <= currentIndex ? 'app-segment--active' : ''}`}
            />
          ))}
        </div>

      {/* 3. Main Question / Game Card */}
      <section className="app-card" aria-labelledby="app-question-heading">
        <div className="app-card-eyebrow-row">
          <span className="app-tag-pill">
            {isGame ? '🎮 MINI-GAME CHALLENGE' : 'MULTIPLE CHOICE'}
          </span>
          <span className="app-category-text">
            {question.category || 'DATA & SECURITY'}
          </span>
        </div>

        <h1 id="app-question-heading" className="app-card-title">
          {displayTitle}
        </h1>

        <p className="app-card-subtitle">
          {displayInstruction}
        </p>

        {/* Dynamic Mini-Game Interactive Runner OR MCQ Option Tiles */}
        {isGame ? (
          <div className="app-game-container" style={{ marginTop: '16px', width: '100%' }}>
            {selectedIdx !== null ? (
              <div className="emoji-game-result" style={{ padding: '20px 0' }}>
                <div className={`emoji-game-result__card ${selectedIdx === (question.correctAnswer ?? 1) ? 'emoji-game-result__card--won' : 'emoji-game-result__card--lost'}`}>
                  <span className="emoji-game-result__icon">{selectedIdx === (question.correctAnswer ?? 1) ? '🎉' : '😅'}</span>
                  <p className="emoji-game-result__msg">
                    {selectedIdx === (question.correctAnswer ?? 1)
                      ? (question.gameData?.winMsg || 'Challenge Completed! 🎉')
                      : (question.gameData?.loseMsg || 'Even robots miss sometimes 🤖')}
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: selectedIdx === (question.correctAnswer ?? 1) ? '#16a34a' : '#dc2626' }}>
                    {selectedIdx === (question.correctAnswer ?? 1) ? '✓ Challenge Completed (+1 Point)' : 'Challenge Failed (0 Points)'}
                  </div>
                  <button
                    type="button"
                    className="emoji-btn emoji-btn--replay"
                    style={{
                      marginTop: '14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      padding: '8px 20px',
                      background: 'rgba(255,255,255,0.25)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: '20px',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelectedIdx(null);
                    }}
                  >
                    🔄 Play Again
                  </button>
                </div>
              </div>
            ) : (
              <GameRunner
                key={`${question.id}_${currentIndex}`}
                question={question}
                onDone={(won) => {
                  const ansIdx = won ? (question.correctAnswer ?? 1) : 0;
                  handleSelectOption(ansIdx);
                }}
              />
            )}
          </div>
        ) : (
          <div className="app-options-list" role="radiogroup" aria-label="Answer options">
            {question.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`app-option-tile ${isSelected ? 'app-option-tile--selected' : ''}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  <span className="app-option-letter" aria-hidden="true">
                    {LETTERS[idx]}
                  </span>
                  <span className="app-option-content">{option}</span>
                  <span className="app-radio-indicator" aria-hidden="true">
                    {isSelected && <span className="app-radio-dot" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="app-card-spacer" aria-hidden="true" />
      </section>
      </div>

      {/* 4. Bottom Sticky Action Dock */}
      <footer className="app-bottom-dock">
        <button
          type="button"
          className="app-dock-btn app-dock-btn--secondary"
          onClick={onPrev}
          disabled={currentIndex === 0 || submitting || expired}
        >
          ← Back
        </button>

        <button
          type="button"
          className="app-dock-btn app-dock-btn--primary"
          onClick={handleProceed}
          disabled={selectedIdx === null || submitting || expired}
        >
          {isLast ? (
            submitting ? (
              <span className="app-btn-loading-content">
                <span className="app-spinner-icon" aria-hidden="true" />
                <span>Saving to Firebase…</span>
              </span>
            ) : (
              'Submit Challenge'
            )
          ) : (
            'Next Question →'
          )}
        </button>
      </footer>

      {/* 5. Firebase Saving Progress Indicator Overlay */}
      {submitting && (
        <div className="app-submitting-overlay" role="status" aria-live="polite">
          <div className="app-submitting-card">
            <div className="app-submitting-spinner-box">
              <span className="app-spinner-icon app-spinner-icon--large" aria-hidden="true" />
            </div>
            <h2 className="app-submitting-title">Recording Challenge Score</h2>
            <p className="app-submitting-sub">
              Saving your results to Wells Fargo Firebase Cloud…
            </p>
            <div className="app-submitting-pulse-badge">
              <span className="app-pulse-dot" />
              <span>Please hold on</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

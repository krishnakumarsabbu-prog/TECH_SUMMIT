import { useMemo, useState, useCallback } from 'react';
import type { Participant, BoothResult, BoothConfig } from '../types';
import { BOOTHS, REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import { Button } from '../components/Button';
import { QRScannerModal } from '../components/QRScannerModal';
import { parseBoothFromScan } from '../utils/qrHelper';

interface PassportProps {
  participant: Participant | null;
  boothResults: Record<string, BoothResult>;
  onBackToCurrent?: () => void;
  hasActiveQuiz?: boolean;
  onLaunchBooth?: (booth: BoothConfig) => void;
  onOpenUrl?: (url: string) => void;
}

export function Passport({
  participant,
  boothResults,
  onBackToCurrent,
  hasActiveQuiz,
  onLaunchBooth,
  onOpenUrl,
}: PassportProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTargetBooth, setScanTargetBooth] = useState<BoothConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const completedList = useMemo(() => Object.values(boothResults), [boothResults]);
  const completedCount = completedList.length;
  const isWinner = completedCount >= REQUIRED_BOOTHS_TO_WIN;
  const remainingToWin = Math.max(0, REQUIRED_BOOTHS_TO_WIN - completedCount);

  // Overall statistics
  const stats = useMemo(() => {
    let totalScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    completedList.forEach((r) => {
      totalScore += r.score;
      totalQuestions += r.totalQuestions;
      totalTime += r.timeTakenSeconds;
    });

    const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const avgTime = completedCount > 0 ? Math.round(totalTime / completedCount) : 0;

    return { totalScore, totalQuestions, accuracy, avgTime, totalTime };
  }, [completedList, completedCount]);

  const progressPercentage = Math.min(100, Math.round((completedCount / REQUIRED_BOOTHS_TO_WIN) * 100));

  const handleOpenScanner = useCallback((target?: BoothConfig | null) => {
    setScanTargetBooth(target || null);
    setIsScannerOpen(true);
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const { booth, externalUrl } = parseBoothFromScan(decodedText);
    setIsScannerOpen(false);

    if (booth) {
      if (onLaunchBooth) {
        onLaunchBooth(booth);
      }
    } else if (externalUrl) {
      if (onOpenUrl) {
        onOpenUrl(externalUrl);
      } else {
        window.location.href = externalUrl;
      }
    } else {
      setToastMessage(
        `Scanned: "${decodedText.length > 40 ? decodedText.slice(0, 40) + '...' : decodedText}". Not recognized as a summit booth challenge.`
      );
      setTimeout(() => setToastMessage(null), 4500);
    }
  }, [onLaunchBooth, onOpenUrl]);

  return (
    <div className="ts-page ts-page--passport">
      <div className="ts-page__container ts-page__container--wide">
        {/* Top Header Card */}
        <div className="ts-passport-header">
          <div className="ts-passport-badge-tag">
            <span>OFFICIAL SUMMIT PASSPORT</span>
          </div>

          <h1 className="ts-page__title ts-page__title--sm">
            {participant ? `${participant.name.toUpperCase()}'S CHALLENGE PASSPORT` : 'SUMMIT CHALLENGE PASSPORT'}
          </h1>

          {participant && (
            <p className="ts-passport-meta">
              <span>👤 <strong>{participant.name}</strong></span>
              <span> • 🆔 EntID: <strong>{participant.entId}</strong></span>
            </p>
          )}
        </div>

        {/* Win / Progress Banner */}
        <div className={`ts-qualification-banner ${isWinner ? 'ts-qualification-banner--winner' : 'ts-qualification-banner--progress'}`}>
          <div className="ts-qualification-icon" aria-hidden="true">
            {isWinner ? '🏆' : '🎯'}
          </div>

          <div className="ts-qualification-content">
            <div className="ts-qualification-title">
              {isWinner ? 'SUMMIT PRIZE QUALIFIER & WINNER!' : `CHALLENGE IN PROGRESS — ${completedCount} OF ${REQUIRED_BOOTHS_TO_WIN} TO WIN`}
            </div>

            <p className="ts-qualification-desc">
              {isWinner
                ? `Incredible achievement! You have completed ${completedCount} of 9 booth quizzes (requirement: at least 4). Present this digital pass at the Tech Summit helpdesk for your prize!`
                : `You have completed ${completedCount} booth(s). Complete at least ${remainingToWin} more booth ${remainingToWin === 1 ? 'quiz' : 'quizzes'} to unlock official prize qualification.`}
            </p>

            {/* Progress bar toward 4-booth milestone */}
            <div className="ts-passport-progress-bar-wrap">
              <div className="ts-passport-progress-bar">
                <div
                  className="ts-passport-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="ts-passport-progress-labels">
                <span>{completedCount} Played</span>
                <span>Goal: {REQUIRED_BOOTHS_TO_WIN} Quizzes ({progressPercentage}%)</span>
                <span>Max: {TOTAL_BOOTHS} Booths</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregated Score Summary */}
        <div className="ts-passport-stats-grid">
          <div className="ts-stat-card">
            <span className="ts-stat-card__number">{completedCount} / {TOTAL_BOOTHS}</span>
            <span className="ts-stat-card__label">BOOTHS PLAYED</span>
          </div>
          <div className="ts-stat-card">
            <span className="ts-stat-card__number">{stats.totalScore} / {stats.totalQuestions}</span>
            <span className="ts-stat-card__label">TOTAL SCORE</span>
          </div>
          <div className="ts-stat-card">
            <span className="ts-stat-card__number">{stats.accuracy}%</span>
            <span className="ts-stat-card__label">OVERALL ACCURACY</span>
          </div>
          <div className="ts-stat-card">
            <span className="ts-stat-card__number">{stats.avgTime}s</span>
            <span className="ts-stat-card__label">AVG TIME / BOOTH</span>
          </div>
        </div>

        {/* 9 Booths Matrix */}
        <div className="ts-booths-matrix-section">
          <div className="ts-matrix-header">
            <div>
              <h2 className="ts-matrix-title">All 9 Summit Booths Status</h2>
              <span className="ts-matrix-subtitle">Physical booth visits required: Scan each booth's standee QR code on-site to unlock</span>
            </div>
            <button
              type="button"
              className="ts-passport-scan-qr-btn"
              onClick={() => handleOpenScanner(null)}
              title="Open camera to scan any booth QR code"
            >
              📷 Scan QR to Play
            </button>
          </div>

          <div className="ts-booths-grid">
            {BOOTHS.map((booth) => {
              const res = boothResults[booth.id];
              const isCompleted = Boolean(res);

              return (
                <div
                  key={booth.id}
                  className={`ts-booth-card ${isCompleted ? 'ts-booth-card--completed' : 'ts-booth-card--pending'}`}
                >
                  <div className="ts-booth-card__top">
                    <span className="ts-booth-card__number">BOOTH {booth.number}</span>
                    <span className={`ts-booth-card__status-pill ${isCompleted ? 'ts-pill-done' : 'ts-pill-todo'}`}>
                      {isCompleted ? '✓ Completed' : 'Awaiting Visit'}
                    </span>
                  </div>

                  <div className="ts-booth-card__body">
                    <div className="ts-booth-card__icon">{booth.icon}</div>
                    <div className="ts-booth-card__details">
                      <h3 className="ts-booth-card__title">{booth.title}</h3>
                      <p className="ts-booth-card__desc">{booth.description}</p>
                    </div>
                  </div>

                  {isCompleted && res ? (
                    <div className="ts-booth-card__result">
                      <div className="ts-booth-card__score">
                        <span>Score: <strong>{res.score} / {res.totalQuestions}</strong> ({res.percentage}%)</span>
                        <span>⏱️ {res.timeTakenSeconds}s</span>
                      </div>
                      <div className="ts-booth-card__timestamp">
                        Completed: {new Date(res.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    <div className="ts-booth-card__action">
                      <button
                        type="button"
                        className="ts-booth-scan-pill ts-booth-scan-pill--clickable"
                        onClick={() => handleOpenScanner(booth)}
                        title={`Open camera to scan Booth ${booth.number} QR code`}
                      >
                        <span>📷 Scan QR to play Booth {booth.number}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Back / Navigation button */}
        {hasActiveQuiz && onBackToCurrent && (
          <div className="ts-passport-actions">
            <Button onClick={onBackToCurrent} fullWidth>
              RETURN TO CURRENT QUIZ
            </Button>
          </div>
        )}

        {/* Live Camera QR Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          targetBooth={scanTargetBooth}
        />

        {/* Toast feedback */}
        {toastMessage && (
          <div className="ts-scanner-toast ts-scanner-toast--error" role="alert">
            <span>⚠️</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

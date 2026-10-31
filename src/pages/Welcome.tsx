import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BoothConfig, Participant } from '../types';
import { Button } from '../components/Button';
import { BOOTHS, REQUIRED_BOOTHS_TO_WIN, TOTAL_BOOTHS } from '../data/boothsConfig';
import {
  SparklesIcon,
  ChevronRightIcon,
  CloseIcon,
  getBoothIcon,
  AlertCircleIcon,
} from '../components/Icons';
import { QRScannerModal } from '../components/QRScannerModal';
import { parseBoothFromScan, playErrorSound } from '../utils/qrHelper';
import { MobileNav } from '../components/MobileNav';

interface WelcomeProps {
  targetBooth: BoothConfig | null;
  participant: Participant | null;
  completedCount: number;
  onStart: () => void;
  onResume: () => void;
  hasSavedQuiz: boolean;
  onOpenPassport: () => void;
  onSelectBooth?: (booth: BoothConfig) => void;
}

export function Welcome({
  targetBooth,
  participant,
  completedCount,
  onStart,
  onResume,
  hasSavedQuiz,
  onOpenPassport,
  onSelectBooth,
}: WelcomeProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTargetBooth, setScanTargetBooth] = useState<BoothConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isTargetReached = completedCount >= REQUIRED_BOOTHS_TO_WIN;

  const modalRef = useRef<HTMLDivElement>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showInfoModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    modalCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowInfoModal(false);
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [showInfoModal]);

  const handleOpenScanner = useCallback((target?: BoothConfig | null) => {
    setScanTargetBooth(target || null);
    setIsScannerOpen(true);
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const { booth, externalUrl } = parseBoothFromScan(decodedText);

    if (scanTargetBooth && booth && booth.id !== scanTargetBooth.id) {
      playErrorSound();
      setToastMessage(
        `Wrong Booth! You selected Booth ${scanTargetBooth.number} (${scanTargetBooth.title}), but scanned Booth ${booth.number} (${booth.title}). Please scan the QR code for Booth ${scanTargetBooth.number} to play.`
      );
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    setIsScannerOpen(false);

    if (booth) {
      if (onSelectBooth) {
        onSelectBooth(booth);
      } else {
        onStart();
      }
    } else if (externalUrl) {
      window.location.href = externalUrl;
    } else {
      setToastMessage(
        `Scanned: "${decodedText.length > 40 ? decodedText.slice(0, 40) + '...' : decodedText}". Not recognized as a summit booth challenge.`
      );
      setTimeout(() => setToastMessage(null), 4500);
    }
  }, [scanTargetBooth, onSelectBooth, onStart]);

  const handleBoothClick = (booth: BoothConfig) => {
    handleOpenScanner(booth);
  };

  return (
    <div className="ts-page ts-page--welcome">
      <section className="ts-hero-card" role="region" aria-label="Innovation Showcase 2026">
        <div className="ts-hero-card__orb" aria-hidden="true" />

        <div className="ts-hero-content">
          <div className="ts-hero-copy">
            <span className="ts-hero-eyebrow">
              <SparklesIcon size={14} className="ts-hero-eyebrow__icon" aria-hidden="true" />
              WELCOME, INNOVATOR
            </span>
            <h1 className="ts-hero-title">
              Ideas become<br />
              <span className="ts-gradient-text">impact.</span>
            </h1>
            <p className="ts-hero-description">
              Explore nine showcases, take on up to four challenges and earn your spot on the leaderboard.
            </p>
          </div>

          <svg className="ts-hero-art" viewBox="0 0 360 420" role="img" aria-label="Glowing light bulb representing innovation">
            <defs>
              <radialGradient id="bulb-halo" cx="50%" cy="42%" r="55%">
                <stop offset="0%" stopColor="#fff4c2" stopOpacity=".95" />
                <stop offset="55%" stopColor="#ffd18c" stopOpacity=".48" />
                <stop offset="100%" stopColor="#fff7e6" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="bulb-glass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" stopOpacity=".98" />
                <stop offset="45%" stopColor="#ffe7a7" stopOpacity=".62" />
                <stop offset="100%" stopColor="#fff" stopOpacity=".88" />
              </linearGradient>
              <linearGradient id="bulb-base" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f4a22a" />
                <stop offset="50%" stopColor="#fff1bc" />
                <stop offset="100%" stopColor="#e77922" />
              </linearGradient>
              <filter id="bulb-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="11" />
              </filter>
            </defs>
            <circle cx="190" cy="188" r="152" fill="url(#bulb-halo)" />
            <path d="M25 295 C112 215 210 350 350 226" fill="none" stroke="#f8be45" strokeWidth="17" strokeLinecap="round" opacity=".8" />
            <path d="M18 331 C115 250 244 377 355 277" fill="none" stroke="#e5254d" strokeWidth="13" strokeLinecap="round" opacity=".85" />
            <path d="M48 362 C139 293 236 389 340 324" fill="none" stroke="#f49a22" strokeWidth="9" strokeLinecap="round" opacity=".9" />
            <path d="M179 84 C132 84 104 119 108 163 C111 196 132 208 141 234 L149 263 L217 263 L226 234 C236 208 257 193 259 160 C262 117 228 84 179 84Z" fill="#ffcc61" opacity=".54" filter="url(#bulb-glow)" />
            <path d="M179 77 C132 77 103 112 107 157 C110 191 132 204 141 231 L149 259 L217 259 L226 231 C235 205 256 190 259 157 C263 112 229 77 179 77Z" fill="url(#bulb-glass)" stroke="#fff" strokeWidth="5" />
            <path d="M144 156 C156 135 164 129 174 124 M214 156 C202 135 194 129 184 124 M179 126 L179 221 M148 166 C158 171 162 178 164 189 M210 166 C200 171 196 178 194 189" fill="none" stroke="#fffdf3" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            <circle cx="145" cy="156" r="10" fill="none" stroke="#fffdf3" strokeWidth="3" />
            <circle cx="213" cy="156" r="10" fill="none" stroke="#fffdf3" strokeWidth="3" />
            <circle cx="164" cy="190" r="9" fill="none" stroke="#fffdf3" strokeWidth="3" />
            <circle cx="194" cy="190" r="9" fill="none" stroke="#fffdf3" strokeWidth="3" />
            <path d="M151 263 H215 L207 281 H159 Z M157 284 H209 L202 300 H164 Z M165 303 H201 L193 320 H173 Z" fill="url(#bulb-base)" stroke="#fff8e4" strokeWidth="3" strokeLinejoin="round" />
            <path d="M137 326 H229 C238 326 245 333 245 342 V349 H121 V342 C121 333 128 326 137 326Z" fill="#fff" fillOpacity=".52" stroke="#fff" strokeWidth="4" />
          </svg>

          {targetBooth && (
            <div className="ts-hero-scanned-card">
              <span className="ts-hero-scanned-icon">{getBoothIcon(targetBooth.number, 22)}</span>
              <div className="ts-hero-scanned-text">
                <span className="ts-hero-scanned-label">QR CODE DETECTED</span>
                <h3 className="ts-hero-scanned-title">Booth {targetBooth.number}: {targetBooth.title}</h3>
              </div>
            </div>
          )}

          <div className="ts-hero-cta-group">
            <button
              type="button"
              className="ts-hero-primary-btn"
              onClick={hasSavedQuiz ? onResume : onStart}
            >
              <span className="ts-hero-primary-btn__text">
                {hasSavedQuiz
                  ? 'Resume Active Quiz'
                  : participant
                  ? 'Enter Challenge Passport'
                  : 'Register for Tech Challenge'}
              </span>
            </button>

            {participant ? (
              <button
                type="button"
                className={`ts-hero-passport-link ${isTargetReached ? 'ts-hero-passport-link--winner' : ''}`}
                onClick={onOpenPassport}
              >
                {isTargetReached
                  ? `🏆 Target Reached! (${completedCount}/${REQUIRED_BOOTHS_TO_WIN}) View Passport`
                  : `Passport progress (${completedCount}/${REQUIRED_BOOTHS_TO_WIN})`}
              </button>
            ) : (
              <button
                type="button"
                className="ts-hero-rules-link"
                onClick={() => setShowInfoModal(true)}
              >
                View Challenge Guidelines &amp; Prize Rules
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="ts-info-cards">
        <div className="ts-info-card">
          <span className="ts-info-card__value">{TOTAL_BOOTHS}</span>
          <span className="ts-info-card__label">BOOTHS</span>
        </div>
        <div className={`ts-info-card ${isTargetReached ? 'ts-info-card--target-reached' : ''}`}>
          <span className="ts-info-card__value">{isTargetReached ? '✓ 4' : REQUIRED_BOOTHS_TO_WIN}</span>
          <span className="ts-info-card__label">{isTargetReached ? 'TARGET REACHED' : 'TO WIN'}</span>
        </div>
        <div className="ts-info-card">
          <span className="ts-info-card__value">60s</span>
          <span className="ts-info-card__label">PER QUIZ</span>
        </div>
      </div>

      <div className="ts-showcase-section" id="booths">
        <div className="ts-showcase-section__header">
          <div className="ts-showcase-section__heading-row">
            <h2 className="ts-showcase-section__title">Explore the booths</h2>
            <a className="ts-showcase-view-all" href="#booths-grid">
              View all
            </a>
          </div>
        </div>

        <div className="ts-showcase-booths-grid" id="booths-grid">
          {BOOTHS.map((b) => (
            <div
              key={b.id}
              className={`ts-showcase-booth-card ${targetBooth?.id === b.id ? 'ts-showcase-booth-card--active' : ''}`}
              onClick={() => handleBoothClick(b)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ') e.preventDefault();
                if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) handleBoothClick(b);
              }}
            >
              <div className="ts-showcase-booth-card__icon" aria-hidden="true">
                {getBoothIcon(b.number, 22)}
              </div>

              <div className="ts-showcase-booth-card__content">
                <span className="ts-showcase-booth-card__num">BOOTH {b.number}</span>
                <h3 className="ts-showcase-booth-card__title">{b.title}</h3>
                <p className="ts-showcase-booth-card__desc">{b.description}</p>
              </div>

              {targetBooth?.id === b.id && (
                <span className="ts-booth-scanned-pill">Scanned</span>
              )}

              <span className="ts-showcase-booth-card__arrow" aria-hidden="true">
                <ChevronRightIcon size={18} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Action Banner */}
      <div className="ts-welcome-actions">
        <Button onClick={hasSavedQuiz ? onResume : onStart} fullWidth variant="secondary">
          {hasSavedQuiz
            ? 'Resume Current Quiz'
            : participant
            ? 'View Full Passport & Progress'
            : 'Register for Innovation Showcase'}
        </Button>
      </div>

      <p className="ts-page__footer">
        Scan a booth QR code to unlock its quiz.
      </p>

      <MobileNav
        activeItem="home"
        onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onBooths={() => document.getElementById('booths')?.scrollIntoView({ behavior: 'smooth' })}
        onPassport={onOpenPassport}
        onFaqs={() => setShowInfoModal(true)}
        onProfile={onStart}
      />

      {/* Info Dialog Modal */}
      {showInfoModal && typeof document !== 'undefined' && createPortal(
        <div className="ts-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div
            ref={modalRef}
            className="ts-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-guidelines-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ts-modal-header">
              <div className="ts-modal-header__brand">
                <div className="ts-modal-header__icon-badge" aria-hidden="true"><SparklesIcon size={18} /></div>
                <div>
                  <div className="ts-modal-eyebrow">CHALLENGE GUIDELINES</div>
                  <h2 id="welcome-guidelines-title" className="ts-modal-title">Innovation Showcase 2026</h2>
                </div>
              </div>
              <button
                ref={modalCloseButtonRef}
                type="button"
                className="ts-modal-close-btn"
                onClick={() => setShowInfoModal(false)}
                aria-label="Close"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="ts-modal-body">
              <div className="ts-sync-destination-card">
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Venues:</span>
                  <span className="ts-sync-dest-value">Bengaluru | Hyderabad | Virtual</span>
                </div>
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Theme:</span>
                  <span className="ts-sync-dest-value" style={{ color: 'var(--accent-gold)' }}>INNOVATE • ADOPT • REUSE</span>
                </div>
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Tech Talks:</span>
                  <span className="ts-sync-dest-value">October 26–30, 2026</span>
                </div>
                <div className="ts-sync-dest-row">
                  <span className="ts-sync-dest-label">Flagship Event:</span>
                  <span className="ts-sync-dest-value">November 2, 2026</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Interactive 9-Booth Rules:
                </h4>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                  <li>Choose up to 4 quizzes from the 9 core architectural and emerging technology booths.</li>
                  <li>Each booth quiz has 5 targeted questions with a rapid 60-second timer.</li>
                  <li>Complete <strong>4 booths</strong> to qualify for the official Summit Winner Prize. Each participant can play a maximum of 4 booths.</li>
                  <li>Registration and completed quiz attempts sync to Firebase Firestore and are cached on this device.</li>
                </ul>
              </div>

              <div className="ts-modal-actions">
                <Button variant="primary" onClick={() => setShowInfoModal(false)}>
                  Got it, Let's Play!
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
          <span><AlertCircleIcon size={18} /></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

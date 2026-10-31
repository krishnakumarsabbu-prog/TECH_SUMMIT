import { useState } from 'react';
import type { Participant, BoothConfig, BoothResult } from '../types';
import {
  fetchParticipantFromFirestore,
  saveParticipantRegistrationInFirestore,
} from '../services/firebaseService';
import { getBoothIcon } from '../components/Icons';
import { AppStickyHeader } from '../components/AppStickyHeader';

interface ParticipantDetailsProps {
  initialData: Partial<Participant> | null;
  targetBooth?: BoothConfig | null;
  onContinue: (participant: Participant, restoredResults?: Record<string, BoothResult>) => void;
  onBack?: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
}

function getInitials(nameStr: string): string {
  if (!nameStr.trim()) return 'WF';
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ParticipantDetails({
  initialData,
  targetBooth,
  onContinue,
  onBack,
}: ParticipantDetailsProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? (initialData as any)?.entId ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const e: FormErrors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      e.name = 'Please enter your full name.';
    } else if (cleanName.length < 2) {
      e.name = 'Name must be at least 2 characters.';
    }

    if (!cleanEmail) {
      e.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      e.email = 'Please enter a valid email address.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    const cleanName = name.trim().replace(/\s+/g, ' ');
    const cleanEmail = email.trim().toLowerCase();

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const existing = await fetchParticipantFromFirestore(cleanEmail);
      if (existing.error) {
        console.warn('[Registration] Unable to check existing attendee:', existing.error);
        setSubmitError('We could not check your passport right now. Please check your connection and try again.');
        return;
      }

      const participant: Participant = {
        name: cleanName || existing.participant?.name || '',
        email: cleanEmail,
        role: 'Summit Attendee',
      };

      if (existing.exists) {
        onContinue(participant, existing.boothResults ?? {});
        return;
      }

      const saveRes = await saveParticipantRegistrationInFirestore(participant);
      if (!saveRes.success) {
        console.warn('[Registration] Unable to save attendee:', saveRes.error);
        setSubmitError('We could not save your registration right now. Please check your connection and try again.');
        return;
      }

      onContinue(participant);
    } catch (error) {
      console.warn('[Registration] Attendee registration failed:', error);
      setSubmitError('We could not save your registration right now. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const avatarInitials = getInitials(name);

  return (
    <div className="app-screen" role="main">
      {/* 1. Universal Sticky Top Header */}
      <AppStickyHeader
        subtitle="Attendee Registration"
        rightAction={
          <span className="app-tag-pill" style={{ margin: 0 }}>
            PASS 2026
          </span>
        }
      />

      {/* 2. Scrollable Middle Body */}
      <div className="app-screen-body">
        {/* Scanned Target Booth Banner if scanned via QR */}
        {targetBooth && (
          <div
            className="app-card"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              background: 'var(--app-primary-light)',
              borderColor: 'rgba(37, 99, 235, 0.25)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'var(--app-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getBoothIcon(targetBooth.number, 20)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--app-primary)', textTransform: 'uppercase' }}>
                Scanned Booth #{targetBooth.number}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--app-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {targetBooth.title}
              </div>
            </div>
          </div>
        )}

        {/* Official Summit Pass Preview Card */}
        <section className="app-card app-pass-card" aria-label="Official Pass Preview">
          <div className="app-pass-card__header">
            <div className="app-pass-avatar" aria-hidden="true">
              {avatarInitials}
            </div>
            <div className="app-pass-info">
              <span className="app-pass-label">OFFICIAL SUMMIT PASS</span>
              <h2 className="app-pass-name">{name.trim() || 'Attendee Name'}</h2>
              <span className="app-pass-email">{email.trim() || 'alex.morgan@gmail.com'}</span>
            </div>
            <div className="app-pass-status-pill">
              VERIFIED
            </div>
          </div>
        </section>

        {/* Registration Form Card */}
        <section className="app-card" aria-label="Registration Form">
          <div className="app-card-eyebrow-row">
            <span className="app-tag-pill">SECURITY & ACCESS</span>
            <span className="app-category-text">ATTENDEE PASS</span>
          </div>

          <h1 className="app-card-title">Attendee Access</h1>
          <p className="app-card-subtitle">
            Enter your name and email to initialize your Summit Challenge Passport, sync points, and enter the prize pool.
          </p>

          <form id="app-login-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
            {/* Full Name Field */}
            <div className="app-field-group">
              <label htmlFor="reg-name" className="app-field-label">
                Full Name <span style={{ color: 'var(--app-danger)' }}>*</span>
              </label>
              <div className="app-input-wrap">
                <svg className="app-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  className={`app-text-input ${errors.name ? 'app-text-input--error' : ''}`}
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  autoComplete="name"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {errors.name && <span className="app-field-error-text">{errors.name}</span>}
            </div>

            {/* Email Address Field */}
            <div className="app-field-group">
              <label htmlFor="reg-email" className="app-field-label">
                Email Address <span style={{ color: 'var(--app-danger)' }}>*</span>
              </label>
              <div className="app-input-wrap">
                <svg className="app-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  className={`app-text-input ${errors.email ? 'app-text-input--error' : ''}`}
                  placeholder="e.g. alex.morgan@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <span className="app-field-error-text">{errors.email}</span>}
            </div>

            {/* Error Message */}
            {submitError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--app-danger-light)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--app-danger)',
                  fontSize: '13px',
                  lineHeight: '1.4',
                }}
                role="alert"
              >
                {submitError}
              </div>
            )}
          </form>

          {/* Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '8px',
              paddingTop: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--app-text-secondary)' }}>
              <span style={{ color: 'var(--app-success)', fontWeight: 700 }}>✓</span>
              <span>Complete <strong>4 booths</strong> to qualify for Summit Prizes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--app-text-secondary)' }}>
              <span style={{ color: 'var(--app-primary)', fontWeight: 700 }}>✓</span>
              <span>Instant cloud sync across your phone and browsers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--app-text-secondary)' }}>
              <span style={{ color: 'var(--app-accent)', fontWeight: 700 }}>✓</span>
              <span>Official 2026 Summit Leaderboard eligible</span>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Bottom Sticky Action Dock */}
      <footer className="app-bottom-dock">
        {onBack && (
          <button
            type="button"
            className="app-dock-btn app-dock-btn--secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            ← Back
          </button>
        )}
        <button
          type="submit"
          form="app-login-form"
          className="app-dock-btn app-dock-btn--primary"
          disabled={isSubmitting}
          style={{ width: onBack ? 'auto' : '100%' }}
        >
          {isSubmitting ? (
            'Preparing Passport…'
          ) : targetBooth ? (
            'Start Booth Challenge →'
          ) : (
            'Continue to Passport →'
          )}
        </button>
      </footer>
    </div>
  );
}

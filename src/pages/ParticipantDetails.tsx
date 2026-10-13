import { useState, useEffect, useRef, useCallback } from 'react';
import type { Participant, BoothConfig, BoothResult } from '../types';
import { Button } from '../components/Button';
import { fetchParticipantFromResultRepo } from '../services/resultRepoService';

export const LOB_OPTIONS = [
  'Technology / Enterprise Technology',
  'Consumer Lending & Retail Banking',
  'Commercial Banking',
  'Corporate & Investment Banking (CIB)',
  'Wealth & Investment Management (WIM)',
  'Enterprise Risk & Compliance',
  'Operations & Shared Services',
  'Finance & Corporate Strategy',
  'Human Resources & Corporate Services',
  'Audit & Legal',
  'Other',
];

interface ParticipantDetailsProps {
  initialData: Partial<Participant> | null;
  targetBooth?: BoothConfig | null;
  onContinue: (participant: Participant, restoredResults?: Record<string, BoothResult>) => void;
  onBack?: () => void;
}

interface FormErrors {
  name?: string;
  entId?: string;
  lob?: string;
}

interface ExistingRecord {
  participant: Participant;
  summary: any;
  boothResults: Record<string, BoothResult>;
}

const AUTO_NAV_DELAY_MS = 3000;

export function ParticipantDetails({
  initialData,
  targetBooth,
  onContinue,
  onBack,
}: ParticipantDetailsProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [entId, setEntId] = useState(initialData?.entId ?? '');
  const [lob, setLob] = useState(initialData?.lob ?? '');
  const [customLob, setCustomLob] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [isCheckingEntId, setIsCheckingEntId] = useState(false);
  const [existingRecord, setExistingRecord] = useState<ExistingRecord | null>(null);
  const [autoNavCountdown, setAutoNavCountdown] = useState<number | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoNavIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nameRef = useRef(name);
  const lobRef = useRef(lob);
  nameRef.current = name;
  lobRef.current = lob;

  const clearAutoNav = useCallback(() => {
    if (autoNavTimer.current) { clearTimeout(autoNavTimer.current); autoNavTimer.current = null; }
    if (autoNavIntervalRef.current) { clearInterval(autoNavIntervalRef.current); autoNavIntervalRef.current = null; }
    setAutoNavCountdown(null);
  }, []);

  const navigateAsExisting = useCallback(
    (record: ExistingRecord) => {
      clearAutoNav();
      const resolvedLob = record.participant.lob && LOB_OPTIONS.includes(record.participant.lob)
        ? record.participant.lob
        : LOB_OPTIONS[0];
      const participant: Participant = {
        name: record.participant.name,
        entId: record.participant.entId.toUpperCase(),
        lob: resolvedLob,
        company: 'Wells Fargo',
        role: 'Summit Attendee',
      };
      onContinue(participant, record.boothResults);
    },
    [clearAutoNav, onContinue],
  );

  const checkEntIdDatabase = useCallback(
    async (idToCheck: string) => {
      const clean = idToCheck.trim().toUpperCase();
      if (clean.length < 3) {
        setExistingRecord(null);
        clearAutoNav();
        return;
      }
      setIsCheckingEntId(true);
      try {
        const res = await fetchParticipantFromResultRepo(clean);
        if (res.exists && res.participant) {
          const record: ExistingRecord = {
            participant: res.participant,
            summary: res.summary,
            boothResults: res.boothResults || {},
          };
          setExistingRecord(record);
          if (!nameRef.current.trim() && res.participant.name) {
            setName(res.participant.name);
          }
          if (!lobRef.current.trim() && res.participant.lob && LOB_OPTIONS.includes(res.participant.lob)) {
            setLob(res.participant.lob);
          }
          setErrors((prev) => ({ ...prev, entId: undefined }));
        } else {
          setExistingRecord(null);
          clearAutoNav();
        }
      } catch {
        setExistingRecord(null);
        clearAutoNav();
      } finally {
        setIsCheckingEntId(false);
      }
    },
    [clearAutoNav],
  );

  // Auto-navigate countdown when existing record is found
  useEffect(() => {
    if (!existingRecord) return;
    const totalSeconds = Math.round(AUTO_NAV_DELAY_MS / 1000);
    setAutoNavCountdown(totalSeconds);
    let remaining = totalSeconds;
    autoNavIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setAutoNavCountdown(remaining > 0 ? remaining : 0);
    }, 1000);
    autoNavTimer.current = setTimeout(() => {
      clearInterval(autoNavIntervalRef.current!);
      autoNavIntervalRef.current = null;
      setAutoNavCountdown(null);
      navigateAsExisting(existingRecord);
    }, AUTO_NAV_DELAY_MS);
    return () => {
      clearInterval(autoNavIntervalRef.current!);
      clearTimeout(autoNavTimer.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRecord]);

  const handleEntIdChange = (val: string) => {
    setEntId(val);
    setErrors((prev) => ({ ...prev, entId: undefined }));
    if (existingRecord) {
      setExistingRecord(null);
      clearAutoNav();
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkEntIdDatabase(val);
    }, 700);
  };

  useEffect(() => {
    if (initialData?.entId) {
      checkEntIdDatabase(initialData.entId);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      clearAutoNav();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!entId.trim()) e.entId = 'Enterprise ID (EntID) is required.';
    if (!lob.trim()) {
      e.lob = 'Please select your Line of Business (LOB).';
    } else if (lob === 'Other' && !customLob.trim()) {
      e.lob = 'Please specify your Line of Business.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    clearAutoNav();

    if (existingRecord) {
      navigateAsExisting(existingRecord);
      return;
    }

    if (!validate()) return;

    const finalLob = lob === 'Other' && customLob.trim() ? customLob.trim() : lob.trim();
    const cleanId = entId.trim().toUpperCase();

    setIsCheckingEntId(true);
    try {
      const checkRes = await fetchParticipantFromResultRepo(cleanId);
      if (checkRes.exists && checkRes.participant) {
        const resolvedLob = checkRes.participant.lob && LOB_OPTIONS.includes(checkRes.participant.lob)
          ? checkRes.participant.lob
          : finalLob || LOB_OPTIONS[0];
        const participant: Participant = {
          name: name.trim().replace(/\s+/g, ' ') || checkRes.participant.name,
          entId: cleanId,
          lob: resolvedLob,
          company: 'Wells Fargo',
          role: 'Summit Attendee',
        };
        onContinue(participant, checkRes.boothResults ?? {});
        return;
      }
    } catch {
      // new user — continue
    } finally {
      setIsCheckingEntId(false);
    }

    onContinue({
      name: name.trim().replace(/\s+/g, ' '),
      entId: cleanId,
      lob: finalLob,
      company: 'Wells Fargo',
      role: 'Participant',
    });
  }

  const testCount = existingRecord
    ? (existingRecord.summary?.totalTestsAppeared ?? Object.keys(existingRecord.boothResults).length)
    : 0;

  const isExistingUserConfirmed = Boolean(existingRecord);

  return (
    <div className="ts-page ts-page--participant">
      <div className="ts-page__container">
        {targetBooth && (
          <div className="ts-participant-booth-pill">
            <span>{targetBooth.icon}</span>
            <span>Booth {targetBooth.number}: <strong>{targetBooth.title}</strong></span>
          </div>
        )}

        <h1 className="ts-page__title ts-page__title--sm">PARTICIPANT REGISTRATION</h1>
        <p className="ts-page__description">
          {isExistingUserConfirmed
            ? 'Your summit passport was found — restoring your progress automatically.'
            : 'Enter your Enterprise ID. If you have participated before, your progress will be restored instantly.'}
        </p>

        {existingRecord && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.10) 100%)',
              border: '1.5px solid rgba(34,197,94,0.55)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <span style={{ fontSize: '30px', flexShrink: 0, lineHeight: '1' }}>✅</span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#16a34a', display: 'block', fontSize: '15.5px', marginBottom: '5px' }}>
                  Welcome back, {existingRecord.participant.name}!
                </strong>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                  EntID: <strong>{existingRecord.participant.entId}</strong>
                  {' · '}
                  {testCount > 0 ? (
                    <>
                      <strong style={{ color: 'var(--brand-red)' }}>
                        {testCount} booth test{testCount !== 1 ? 's' : ''} completed
                      </strong>{' '}
                      — your passport badges will be restored.
                    </>
                  ) : (
                    'Registered — no booth tests yet. Ready to start!'
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    id="btn-continue-as-existing"
                    onClick={() => navigateAsExisting(existingRecord)}
                    style={{
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '0.4px',
                      boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                    }}
                  >
                    {targetBooth ? `▶ Go to Booth ${targetBooth.number} Quiz` : '🎫 Open My Passport'}
                  </button>
                  {autoNavCountdown !== null && autoNavCountdown > 0 && (
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Auto-continuing in {autoNavCountdown}s…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="ts-form" onSubmit={handleSubmit} noValidate>
          <div className="ts-field">
            <label htmlFor="entId" className="ts-field__label">
              Enterprise ID (EntID) <span className="ts-field__required">*</span>
              {isCheckingEntId && (
                <span style={{ fontSize: '11.5px', color: '#0284c7', marginLeft: '8px', fontWeight: 500 }}>
                  🔍 Checking GitHub…
                </span>
              )}
            </label>
            <input
              id="entId"
              type="text"
              className="ts-field__input"
              value={entId}
              onChange={(e) => handleEntIdChange(e.target.value)}
              onBlur={() => { if (!existingRecord) checkEntIdDatabase(entId); }}
              placeholder="e.g. U123456"
              autoCapitalize="characters"
              autoComplete="off"
              aria-required="true"
              aria-invalid={!!errors.entId}
              style={existingRecord ? { borderColor: '#16a34a', boxShadow: '0 0 0 2px rgba(22,163,74,0.25)' } : undefined}
            />
            {errors.entId && <span className="ts-field__error" role="alert">{errors.entId}</span>}
          </div>

          {!isExistingUserConfirmed && (
            <>
              <div className="ts-field">
                <label htmlFor="name" className="ts-field__label">
                  Full Name <span className="ts-field__required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="ts-field__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <span className="ts-field__error" role="alert">{errors.name}</span>}
              </div>

              <div className="ts-field">
                <label htmlFor="lob" className="ts-field__label">
                  Line of Business (LOB) <span className="ts-field__required">*</span>
                </label>
                <select
                  id="lob"
                  className="ts-field__input ts-field__select"
                  value={lob}
                  onChange={(e) => {
                    setLob(e.target.value);
                    if (errors.lob) setErrors((prev) => ({ ...prev, lob: undefined }));
                  }}
                  aria-required="true"
                  aria-invalid={!!errors.lob}
                >
                  <option value="">-- Select Line of Business (LOB) --</option>
                  {LOB_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {errors.lob && <span className="ts-field__error" role="alert">{errors.lob}</span>}
              </div>

              {lob === 'Other' && (
                <div className="ts-field">
                  <label htmlFor="customLob" className="ts-field__label">
                    Specify Line of Business <span className="ts-field__required">*</span>
                  </label>
                  <input
                    id="customLob"
                    type="text"
                    className="ts-field__input"
                    value={customLob}
                    onChange={(e) => setCustomLob(e.target.value)}
                    placeholder="e.g. Innovation Labs / Strategy"
                    aria-required="true"
                  />
                </div>
              )}

              <div className="ts-form__actions">
                {onBack && (
                  <Button type="button" variant="secondary" onClick={onBack}>
                    BACK
                  </Button>
                )}
                <Button type="submit" fullWidth={!onBack} disabled={isCheckingEntId}>
                  {isCheckingEntId ? 'VERIFYING…' : 'REGISTER & CONTINUE →'}
                </Button>
              </div>
            </>
          )}

          {isExistingUserConfirmed && onBack && (
            <div className="ts-form__actions" style={{ marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => { clearAutoNav(); onBack!(); }}>
                BACK
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

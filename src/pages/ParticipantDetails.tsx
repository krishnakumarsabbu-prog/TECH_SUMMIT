import { useState, useEffect, useRef } from 'react';
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
  const [existingRecord, setExistingRecord] = useState<{
    participant: Participant;
    summary: any;
    boothResults: Record<string, BoothResult>;
  } | null>(null);

  const debounceTimer = useRef<any>(null);

  // Check if EntID already exists in results database
  const checkEntIdDatabase = async (idToCheck: string) => {
    const clean = idToCheck.trim().toUpperCase();
    if (clean.length < 3) {
      setExistingRecord(null);
      return;
    }

    setIsCheckingEntId(true);
    try {
      const res = await fetchParticipantFromResultRepo(clean);
      if (res.exists && res.participant) {
        setExistingRecord({
          participant: res.participant,
          summary: res.summary,
          boothResults: res.boothResults || {},
        });
        // Auto-fill existing name and LOB if not already typed
        if (!name.trim() && res.participant.name) {
          setName(res.participant.name);
        }
        if (!lob.trim() && res.participant.lob) {
          setLob(res.participant.lob);
        }
        setErrors((prev) => ({ ...prev, entId: undefined }));
      } else {
        setExistingRecord(null);
      }
    } catch {
      setExistingRecord(null);
    } finally {
      setIsCheckingEntId(false);
    }
  };

  // Handle typing in EntID input with debounce
  const handleEntIdChange = (val: string) => {
    setEntId(val);
    if (errors.entId) setErrors((prev) => ({ ...prev, entId: undefined }));

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkEntIdDatabase(val);
    }, 600);
  };

  // Initial check if initialData has an EntID
  useEffect(() => {
    if (initialData?.entId) {
      checkEntIdDatabase(initialData.entId);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
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
    if (!validate()) return;

    const finalLob = lob === 'Other' && customLob.trim() ? customLob.trim() : lob.trim();
    const cleanId = entId.trim().toUpperCase();

    // If already verified existing record
    if (existingRecord) {
      const participant: Participant = {
        name: name.trim().replace(/\s+/g, ' ') || existingRecord.participant.name,
        entId: cleanId,
        lob: finalLob || existingRecord.participant.lob,
        company: 'Wells Fargo',
        role: 'Summit Attendee',
      };
      onContinue(participant, existingRecord.boothResults);
      return;
    }

    // Fast final check in case user submitted without waiting for debounce
    setIsCheckingEntId(true);
    try {
      const checkRes = await fetchParticipantFromResultRepo(cleanId);
      if (checkRes.exists && checkRes.participant) {
        const participant: Participant = {
          name: name.trim().replace(/\s+/g, ' ') || checkRes.participant.name,
          entId: cleanId,
          lob: finalLob || checkRes.participant.lob,
          company: 'Wells Fargo',
          role: 'Summit Attendee',
        };
        onContinue(participant, checkRes.boothResults || {});
        return;
      }
    } catch {
      // Continue to new registration
    } finally {
      setIsCheckingEntId(false);
    }

    // New participant registration
    onContinue({
      name: name.trim().replace(/\s+/g, ' '),
      entId: cleanId,
      lob: finalLob,
      company: 'Wells Fargo',
      role: 'Participant',
    });
  }

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
          Enter your Name, Enterprise ID (EntID), and Line of Business (LOB).
          If you have already participated on another device or window, entering your EntID will automatically restore your challenge passport!
        </p>

        {/* Existing Record Notification Banner */}
        {existingRecord && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '24px' }}>✨</span>
            <div style={{ fontSize: '13.5px', lineHeight: '1.45', color: 'var(--text-primary)' }}>
              <strong style={{ color: '#16a34a', display: 'block', fontSize: '14.5px', marginBottom: '2px' }}>
                Existing Summit Record Found for {existingRecord.participant.entId}!
              </strong>
              <span>
                Welcome back, <strong>{existingRecord.participant.name}</strong>! Found{' '}
                <strong style={{ color: 'var(--brand-red)' }}>
                  {existingRecord.summary?.totalTestsAppeared || Object.keys(existingRecord.boothResults).length} completed tests
                </strong>{' '}
                in the database. Your passport badges and scores will be restored instantly!
              </span>
            </div>
          </div>
        )}

        <form className="ts-form" onSubmit={handleSubmit} noValidate>
          <div className="ts-field">
            <label htmlFor="entId" className="ts-field__label">
              Enterprise ID (EntID) <span className="ts-field__required">*</span>
              {isCheckingEntId && (
                <span style={{ fontSize: '12px', color: '#0284c7', marginLeft: '8px', fontWeight: 500 }}>
                  🔍 Checking database...
                </span>
              )}
            </label>
            <input
              id="entId"
              type="text"
              className="ts-field__input"
              value={entId}
              onChange={(e) => handleEntIdChange(e.target.value)}
              onBlur={() => checkEntIdDatabase(entId)}
              placeholder="e.g. U123456"
              autoCapitalize="characters"
              aria-required="true"
              aria-invalid={!!errors.entId}
              style={existingRecord ? { borderColor: '#16a34a', boxShadow: '0 0 0 1px #16a34a' } : undefined}
            />
            {errors.entId && <span className="ts-field__error" role="alert">{errors.entId}</span>}
          </div>

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
                <option key={item} value={item}>
                  {item}
                </option>
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
              {existingRecord
                ? `RESTORE PASSPORT & RESUME (${existingRecord.summary?.totalTestsAppeared || Object.keys(existingRecord.boothResults).length} TESTS) →`
                : isCheckingEntId
                ? 'VERIFYING ID...'
                : 'REGISTER & CONTINUE TO PASSPORT →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

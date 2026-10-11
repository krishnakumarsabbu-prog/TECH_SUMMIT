import { useState } from 'react';
import type { Participant, BoothConfig } from '../types';
import { Button } from '../components/Button';

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
  onContinue: (participant: Participant) => void;
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

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    const finalLob = lob === 'Other' && customLob.trim() ? customLob.trim() : lob.trim();
    onContinue({
      name: name.trim().replace(/\s+/g, ' '),
      entId: entId.trim().toUpperCase(),
      lob: finalLob,
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
          Enter your Name, Enterprise ID (EntID), and Line of Business (LOB) to access your Summit Passport and explore all 9 booth challenges.
        </p>

        <form className="ts-form" onSubmit={handleSubmit} noValidate>
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
            <label htmlFor="entId" className="ts-field__label">
              Enterprise ID (EntID) <span className="ts-field__required">*</span>
            </label>
            <input
              id="entId"
              type="text"
              className="ts-field__input"
              value={entId}
              onChange={(e) => setEntId(e.target.value)}
              placeholder="e.g. U123456"
              autoCapitalize="characters"
              aria-required="true"
              aria-invalid={!!errors.entId}
            />
            {errors.entId && <span className="ts-field__error" role="alert">{errors.entId}</span>}
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
            <Button type="submit" fullWidth={!onBack}>
              REGISTER & CONTINUE TO PASSPORT →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

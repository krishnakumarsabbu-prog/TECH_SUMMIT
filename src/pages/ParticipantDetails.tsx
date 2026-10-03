import { useState } from 'react';
import type { Participant, BoothConfig } from '../types';
import { Button } from '../components/Button';

interface ParticipantDetailsProps {
  initialData: Partial<Participant> | null;
  targetBooth?: BoothConfig | null;
  onContinue: (participant: Participant) => void;
  onBack: () => void;
}

interface FormErrors {
  name?: string;
  entId?: string;
}

export function ParticipantDetails({
  initialData,
  targetBooth,
  onContinue,
  onBack,
}: ParticipantDetailsProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [entId, setEntId] = useState(initialData?.entId ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!entId.trim()) e.entId = 'Enterprise ID (EntID) is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onContinue({
      name: name.trim().replace(/\s+/g, ' '),
      entId: entId.trim().toUpperCase(),
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
          Enter your Name and Enterprise ID (EntID) once to unlock all 9 booth challenges.
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

          <div className="ts-form__actions">
            <Button type="button" variant="secondary" onClick={onBack}>
              BACK
            </Button>
            <Button type="submit">
              {targetBooth ? `REGISTER & START BOOTH ${targetBooth.number} QUIZ` : 'REGISTER & START QUIZ'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

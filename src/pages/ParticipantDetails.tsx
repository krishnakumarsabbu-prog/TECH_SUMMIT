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
  company?: string;
  email?: string;
}

export function ParticipantDetails({
  initialData,
  targetBooth,
  onContinue,
  onBack,
}: ParticipantDetailsProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [company, setCompany] = useState(initialData?.company ?? '');
  const [role, setRole] = useState(initialData?.role ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!company.trim()) e.company = 'Company or organization is required.';
    if (!email.trim()) {
      e.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Please enter a valid email address.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onContinue({
      name: name.trim().replace(/\s+/g, ' '),
      company: company.trim().replace(/\s+/g, ' '),
      role: role.trim().replace(/\s+/g, ' '),
      email: email.trim(),
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
          Register once to unlock all 9 booth challenges and link your Summit Passport.
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
            <label htmlFor="company" className="ts-field__label">
              Company / Organization <span className="ts-field__required">*</span>
            </label>
            <input
              id="company"
              type="text"
              className="ts-field__input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Wells Fargo / Acme Corp"
              autoComplete="organization"
              aria-required="true"
              aria-invalid={!!errors.company}
            />
            {errors.company && <span className="ts-field__error" role="alert">{errors.company}</span>}
          </div>

          <div className="ts-field">
            <label htmlFor="role" className="ts-field__label">
              Role / Designation
            </label>
            <input
              id="role"
              type="text"
              className="ts-field__input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              autoComplete="organization-title"
            />
          </div>

          <div className="ts-field">
            <label htmlFor="email" className="ts-field__label">
              Official Email <span className="ts-field__required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="ts-field__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.j@company.com"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className="ts-field__error" role="alert">{errors.email}</span>}
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

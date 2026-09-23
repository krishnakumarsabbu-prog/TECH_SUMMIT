import type { Participant } from '../types';
import { getDeviceId } from './storage';

export function normalizeText(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function generateParticipationKey(
  participant: Pick<Participant, 'name' | 'company'>,
): Promise<string> {
  const normalizedName = normalizeText(participant.name);
  const normalizedCompany = normalizeText(participant.company);
  const deviceId = getDeviceId();
  const raw = `${normalizedName}|${normalizedCompany}|${deviceId}`;

  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback (non-crypto) for very old browsers — best-effort
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${(hash >>> 0).toString(16)}`;
}

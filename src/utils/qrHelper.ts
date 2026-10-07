import { getBoothById } from '../data/boothsConfig';
import type { BoothConfig } from '../types';

/**
 * Parses scanned QR text/URL and resolves it to a BoothConfig,
 * or identifies if it is an external URL.
 */
export function parseBoothFromScan(raw: string): { booth: BoothConfig | null; externalUrl: string | null } {
  if (!raw) return { booth: null, externalUrl: null };
  const trimmed = raw.trim();

  // 1. Try standard URL parsing
  try {
    const url = new URL(trimmed, window.location.href);
    const boothParam = url.searchParams.get('booth') || url.searchParams.get('b');
    if (boothParam) {
      const matched = getBoothById(boothParam);
      if (matched) {
        return { booth: matched, externalUrl: null };
      }
    }

    // Check if path has booth (e.g., /booth-1)
    const pathMatch = url.pathname.match(/booth[/-]?(\d+)/i);
    if (pathMatch && pathMatch[1]) {
      const matched = getBoothById(pathMatch[1]);
      if (matched) {
        return { booth: matched, externalUrl: null };
      }
    }

    // If it's a URL but doesn't have a booth param
    // Check if it's not the same domain/app, it might be an external challenge URL
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { booth: null, externalUrl: trimmed };
    }
  } catch {
    // Not a standard URL, continue with string patterns
  }

  // 2. Query string fragment (e.g. "?booth=3" or "booth=3")
  const paramMatch = trimmed.match(/[?&]?booth=([^&#\s]+)/i) || trimmed.match(/[?&]?b=([^&#\s]+)/i);
  if (paramMatch && paramMatch[1]) {
    const matched = getBoothById(paramMatch[1]);
    if (matched) {
      return { booth: matched, externalUrl: null };
    }
  }

  // 3. Direct booth identifier (e.g., "1", "booth-1", "booth 1")
  const directMatch = getBoothById(trimmed);
  if (directMatch) {
    return { booth: directMatch, externalUrl: null };
  }

  // 4. Raw URL fallback
  if (/^https?:\/\//i.test(trimmed)) {
    return { booth: null, externalUrl: trimmed };
  }

  return { booth: null, externalUrl: null };
}

/**
 * Play a short pleasant feedback audio chime on successful QR scan
 */
export function playScanSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    if (navigator.vibrate) {
      navigator.vibrate(120);
    }
  } catch {
    // AudioContext might be restricted until user gesture; ignore safely
  }
}

/**
 * Play a warning/error feedback tone on mismatched or invalid QR scan
 */
export function playErrorSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    if (navigator.vibrate) {
      navigator.vibrate([100, 60, 100]);
    }
  } catch {
    // Ignore safely
  }
}


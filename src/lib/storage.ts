import { isValidHand } from './hands';
import type { Attempt } from './stats';
import { ACTIONS, CATEGORIES, POSITIONS } from './types';

export const ATTEMPTS_KEY = 'preflop-trainer:v1:attempts';
export const SETTINGS_KEY = 'preflop-trainer:v1:settings';
const MAX_STORED = 5000;

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const VERDICTS = ['perfect', 'correct', 'wrong'];

function isAttempt(x: unknown): x is Attempt {
  if (!x || typeof x !== 'object') return false;
  const a = x as Record<string, unknown>;
  return (
    typeof a.hand === 'string' && isValidHand(a.hand) &&
    (POSITIONS as readonly unknown[]).includes(a.position) &&
    (CATEGORIES as readonly unknown[]).includes(a.category) &&
    (ACTIONS as readonly unknown[]).includes(a.action) &&
    VERDICTS.includes(a.verdict as string) &&
    typeof a.ts === 'number'
  );
}

/** Loads attempts; drops malformed entries instead of crashing on bad storage. */
export function loadAttempts(store: KV = localStorage): Attempt[] {
  try {
    const raw = store.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAttempt) : [];
  } catch {
    return [];
  }
}

export function saveAttempts(attempts: readonly Attempt[], store: KV = localStorage): void {
  try {
    store.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(-MAX_STORED)));
  } catch {
    /* storage full or unavailable: stats just won't persist */
  }
}

export function clearAttempts(store: KV = localStorage): void {
  try {
    store.removeItem(ATTEMPTS_KEY);
  } catch {
    /* ignore */
  }
}

export interface Settings {
  revealBeforeAnswer: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_SETTINGS: Settings = { revealBeforeAnswer: false, autoAdvance: false };

export function loadSettings(store: KV = localStorage): Settings {
  try {
    const raw = store.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      revealBeforeAnswer: p.revealBeforeAnswer === true,
      autoAdvance: p.autoAdvance === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings, store: KV = localStorage): void {
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

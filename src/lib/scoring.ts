import { ACTIONS, type Action, type Freqs } from './types';

export type Verdict = 'perfect' | 'correct' | 'wrong';

/** An action counts as correct if it is played at least this often (RANGES.md §4). */
export const CORRECT_THRESHOLD = 0.2;
const EPS = 1e-9;

export interface ScoreResult {
  action: Action;
  verdict: Verdict;
  /** chosen action frequency >= 0.20 */
  correct: boolean;
  /** chosen action is (one of) the highest-frequency actions */
  perfect: boolean;
  freqs: Freqs;
}

/** Pure scoring rule. Perfect implies correct; ties at the top are all perfect. */
export function scoreAnswer(action: Action, freqs: Freqs): ScoreResult {
  const f = freqs[action];
  const max = Math.max(...ACTIONS.map((a) => freqs[a]));
  const correct = f >= CORRECT_THRESHOLD - EPS;
  const perfect = correct && f >= max - EPS;
  const verdict: Verdict = perfect ? 'perfect' : correct ? 'correct' : 'wrong';
  return { action, verdict, correct, perfect, freqs };
}

/** Whole-percent split that always sums to 100. */
export function freqPercents(freqs: Freqs): Record<Action, number> {
  const raise = Math.round(freqs.raise * 100);
  return { raise, fold: 100 - raise };
}

/** e.g. "Raise 42% / Fold 58%" */
export function formatFreqs(freqs: Freqs): string {
  const p = freqPercents(freqs);
  return `Raise ${p.raise}% / Fold ${p.fold}%`;
}

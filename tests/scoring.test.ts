import { describe, expect, it } from 'vitest';
import { formatFreqs, scoreAnswer } from '../src/lib/scoring';

const f = (raise: number) => ({ raise, fold: 1 - raise });

describe('scoreAnswer (RANGES.md §4)', () => {
  it.each([
    // [action, raise freq, verdict]
    ['raise', 1, 'perfect'],
    ['fold', 1, 'wrong'],
    ['fold', 0, 'perfect'],
    ['raise', 0, 'wrong'],
    ['raise', 0.42, 'correct'], // >= 0.20 but not the top action
    ['fold', 0.42, 'perfect'], // fold 0.58 is top
    ['raise', 0.2, 'correct'], // exactly at the threshold
    ['raise', 0.19, 'wrong'],
    ['fold', 0.8, 'correct'], // fold exactly 0.20
    ['fold', 0.81, 'wrong'], // fold 0.19
    ['raise', 0.5, 'perfect'], // tie: both are top
    ['fold', 0.5, 'perfect'],
  ] as const)('%s @ raise=%d -> %s', (action, raise, verdict) => {
    const r = scoreAnswer(action, f(raise));
    expect(r.verdict).toBe(verdict);
    expect(r.correct).toBe(verdict !== 'wrong');
    expect(r.perfect).toBe(verdict === 'perfect');
  });

  it('handles float noise at the threshold', () => {
    expect(scoreAnswer('fold', { raise: 0.8, fold: 0.19999999999 }).verdict).toBe('correct');
  });

  it('is pure: does not mutate input', () => {
    const freqs = Object.freeze(f(0.3));
    scoreAnswer('raise', freqs);
    expect(freqs).toEqual(f(0.3));
  });
});

describe('formatFreqs', () => {
  it('formats and always sums to 100', () => {
    expect(formatFreqs({ raise: 0.4167, fold: 0.5833 })).toBe('Raise 42% / Fold 58%');
    expect(formatFreqs({ raise: 1, fold: 0 })).toBe('Raise 100% / Fold 0%');
    expect(formatFreqs({ raise: 0.005, fold: 0.995 })).toBe('Raise 1% / Fold 99%');
  });
});

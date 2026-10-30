import { describe, expect, it } from 'vitest';
import type { Verdict } from '../src/lib/scoring';
import { accuracy, computeStats, type Attempt } from '../src/lib/stats';
import { ATTEMPTS_KEY, clearAttempts, loadAttempts, saveAttempts } from '../src/lib/storage';
import type { Category, Position } from '../src/lib/types';

const att = (position: Position, category: Category, verdict: Verdict, hand?: string): Attempt => ({
  position,
  category,
  verdict,
  hand: hand ?? ({ pair: 'AA', suited: 'AKs', offsuit: 'AKo' } as const)[category],
  action: 'raise',
  ts: 0,
});

const many = (n: number, a: Attempt) => Array.from({ length: n }, () => a);

describe('computeStats', () => {
  it('empty', () => {
    const s = computeStats([]);
    expect(s.overall.total).toBe(0);
    expect(accuracy(s.overall)).toBeNull();
    expect(s.leaks).toEqual([]);
  });

  it('counts correct and perfect as accurate, wrong as not', () => {
    const s = computeStats([att('UTG', 'pair', 'perfect'), att('UTG', 'pair', 'correct'), att('HJ', 'offsuit', 'wrong')]);
    expect(s.overall).toEqual({ correct: 2, perfect: 1, total: 3 });
    expect(s.byPosition.UTG).toEqual({ correct: 2, perfect: 1, total: 2 });
    expect(s.byPosition.HJ).toEqual({ correct: 0, perfect: 0, total: 1 });
    expect(s.byPosition.CO.total).toBe(0);
    expect(s.byCategory.pair.correct).toBe(2);
    expect(s.byCategory.offsuit.correct).toBe(0);
  });

  it('leaks: only combos with >= 5 attempts, weakest first, max 5', () => {
    const attempts = [
      ...many(4, att('SB', 'offsuit', 'wrong')), // 4 attempts: excluded
      ...many(5, att('CO', 'suited', 'wrong')), // 0%
      ...many(3, att('BTN', 'offsuit', 'wrong')),
      ...many(3, att('BTN', 'offsuit', 'perfect')), // 50%
      ...many(6, att('UTG', 'pair', 'perfect')), // 100%
      ...many(5, att('HJ', 'pair', 'correct')), // 100%
      ...many(5, att('HJ', 'suited', 'correct')), // 100%
      ...many(1, att('HJ', 'suited', 'wrong')), // -> 5/6
      ...many(5, att('CO', 'pair', 'perfect')), // 100%
      ...many(5, att('UTG', 'offsuit', 'perfect')), // 100%
    ];
    const { leaks } = computeStats(attempts);
    expect(leaks).toHaveLength(5);
    expect(leaks.map((l) => `${l.position}:${l.category}`)).toEqual([
      'CO:suited',
      'BTN:offsuit',
      'HJ:suited',
      'UTG:pair', // 100% ties: more attempts first
      'UTG:offsuit', // then position order
    ]);
    expect(leaks.find((l) => l.position === 'SB')).toBeUndefined();
    expect(leaks[1].accuracy).toBeCloseTo(0.5);
  });

  it('recent keeps the last 20 verdicts in order', () => {
    const attempts = [...many(25, att('UTG', 'pair', 'wrong')), att('UTG', 'pair', 'perfect')];
    const s = computeStats(attempts);
    expect(s.recent).toHaveLength(20);
    expect(s.recent.at(-1)).toBe('perfect');
  });
});

describe('storage', () => {
  const memStore = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  };

  it('round-trips attempts', () => {
    const s = memStore();
    const a = [att('UTG', 'pair', 'perfect'), att('SB', 'offsuit', 'wrong', '72o')];
    saveAttempts(a, s);
    expect(loadAttempts(s)).toEqual(a);
    clearAttempts(s);
    expect(loadAttempts(s)).toEqual([]);
  });

  it('survives corrupt or malformed data', () => {
    const s = memStore();
    s.setItem(ATTEMPTS_KEY, '{not json');
    expect(loadAttempts(s)).toEqual([]);
    s.setItem(ATTEMPTS_KEY, JSON.stringify([att('UTG', 'pair', 'perfect'), { hand: 'ZZ' }, null]));
    expect(loadAttempts(s)).toHaveLength(1);
  });
});

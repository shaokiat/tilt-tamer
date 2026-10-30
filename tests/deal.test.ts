import { describe, expect, it } from 'vitest';
import { dealCards, dealHand, handClassOf } from '../src/lib/deal';
import { ALL_HANDS, categoryOf } from '../src/lib/hands';
import { mulberry32 } from '../src/lib/rng';
import { CATEGORIES, POSITIONS } from '../src/lib/types';

const HANDS = new Set(ALL_HANDS);

describe('dealHand', () => {
  it('1000 deals never produce a hand outside the 169 classes', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const d = dealHand(rng);
      expect(HANDS.has(d.hand), d.hand).toBe(true);
      expect(POSITIONS).toContain(d.position);
      const [a, b] = d.cards;
      expect(a.rank + a.suit).not.toBe(b.rank + b.suit);
      expect(handClassOf(a, b)).toBe(d.hand);
    }
  });

  it('1000 deals: pair/suited/offsuit shares roughly 78:312:936 of 1326', () => {
    const rng = mulberry32(42);
    const n = 1000;
    const counts = { pair: 0, suited: 0, offsuit: 0 };
    for (let i = 0; i < n; i++) counts[categoryOf(dealHand(rng).hand)] += 1;
    const expected = { pair: 78 / 1326, suited: 312 / 1326, offsuit: 936 / 1326 };
    for (const c of CATEGORIES) {
      // ~3.5 sigma for n=1000
      expect(Math.abs(counts[c] / n - expected[c]), c).toBeLessThan(0.05);
    }
  });

  it('per-class frequency is ~6/1326 : 4/1326 : 12/1326 (large sample)', () => {
    const rng = mulberry32(7);
    const n = 200_000;
    const perClass = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const [a, b] = dealCards(rng);
      const h = handClassOf(a, b);
      perClass.set(h, (perClass.get(h) ?? 0) + 1);
    }
    expect(perClass.size).toBe(169);
    const avg = { pair: 0, suited: 0, offsuit: 0 };
    for (const [h, c] of perClass) avg[categoryOf(h)] += c;
    const perClassRate = {
      pair: avg.pair / 13 / n,
      suited: avg.suited / 78 / n,
      offsuit: avg.offsuit / 78 / n,
    };
    expect(perClassRate.pair).toBeCloseTo(6 / 1326, 3);
    expect(perClassRate.suited).toBeCloseTo(4 / 1326, 3);
    expect(perClassRate.offsuit).toBeCloseTo(12 / 1326, 3);
    // ratio check 6:4:12 within 5%
    expect(perClassRate.pair / perClassRate.suited).toBeGreaterThan(1.5 * 0.95);
    expect(perClassRate.pair / perClassRate.suited).toBeLessThan(1.5 * 1.05);
    expect(perClassRate.offsuit / perClassRate.suited).toBeGreaterThan(3 * 0.95);
    expect(perClassRate.offsuit / perClassRate.suited).toBeLessThan(3 * 1.05);
  });

  it('every position gets dealt', () => {
    const rng = mulberry32(3);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(dealHand(rng).position);
    expect(seen).toEqual(new Set(POSITIONS));
  });

  it('survives an rng that returns values near 1', () => {
    const d = dealHand(() => 0.9999999999);
    expect(HANDS.has(d.hand)).toBe(true);
  });
});

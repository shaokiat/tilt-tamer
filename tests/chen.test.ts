import { describe, expect, it } from 'vitest';
import { chenBreakdown, chenScore, compareHands, ORDERED_HANDS, strengthRank } from '../src/lib/chen';
import { parseHand } from '../src/lib/hands';

describe('Chen score (RANGES.md §3.2)', () => {
  it.each([
    ['AA', 20],
    ['KK', 16],
    ['99', 9],
    ['55', 5],
    ['22', 5], // min 5
    ['AKs', 12],
    ['AKo', 10],
    ['KQs', 10], // 8 + 2, no straight bonus (high card not below Q)
    ['JTs', 9], // 6 + 2 + 1 straight bonus
    ['T9o', 6], // 5 + 1
    ['J9s', 8], // 6 + 2 - 1 + 1
    ['T7o', 3], // 5 - 2
    ['A2o', 5], // 10 - 5
    ['72o', -1], // 3.5 - 5 = -1.5, rounded up
  ])('%s = %d', (hand, expected) => {
    expect(chenScore(hand)).toBe(expected);
  });

  it('half points round up', () => {
    expect(chenScore('98s')).toBe(8); // 4.5 + 2 + 1 = 7.5 -> 8
    expect(chenScore('65s')).toBe(6); // 3 + 2 + 1 = 6
    expect(chenScore('97o')).toBe(5); // 4.5 - 1 + 1 = 4.5 -> 5
  });

  it('gap penalties: 3 gap = -4, 4+ gap = -5', () => {
    expect(chenScore('K9o')).toBe(4); // 8 - 4 (Q, J, T between)
    expect(chenScore('K8o')).toBe(3); // 8 - 5 (4 gap)
    expect(chenScore('K2o')).toBe(3); // 8 - 5
  });
});

describe('ordering', () => {
  it('has all 169 classes, strongest first', () => {
    expect(ORDERED_HANDS).toHaveLength(169);
    expect(ORDERED_HANDS[0]).toBe('AA');
    expect(ORDERED_HANDS[1]).toBe('KK');
  });

  it('tie-breaks: pair > suited > offsuit, then high card, then low card', () => {
    // AKs (12) vs QQ(14): score first
    expect(compareHands('QQ', 'AKs')).toBeLessThan(0);
    // 55 and 22 both 5: higher pair first
    expect(compareHands('55', '22')).toBeLessThan(0);
    // Same score 10: pair (TT) > suited (KQs) > offsuit (AKo)
    expect(chenScore('TT')).toBe(10);
    expect(compareHands('TT', 'KQs')).toBeLessThan(0);
    expect(compareHands('KQs', 'AKo')).toBeLessThan(0);
    // Same score, same category: higher high card first (AJo = KQo = 8)
    expect(chenScore('AJo')).toBe(8);
    expect(chenScore('KQo')).toBe(8);
    expect(compareHands('AJo', 'KQo')).toBeLessThan(0);
    // Same score, category and high card: higher low card first (A9s = A5s = 7)
    expect(chenScore('A9s')).toBe(7);
    expect(chenScore('A5s')).toBe(7);
    expect(compareHands('A9s', 'A5s')).toBeLessThan(0);
  });

  it('is monotone non-increasing in score', () => {
    for (let i = 1; i < ORDERED_HANDS.length; i++) {
      expect(chenScore(ORDERED_HANDS[i])).toBeLessThanOrEqual(chenScore(ORDERED_HANDS[i - 1]));
    }
  });
});

describe('chenBreakdown', () => {
  it('steps always sum to the raw score, and rounding up gives chenScore, for all 169 hands', () => {
    for (const hand of ORDERED_HANDS) {
      const b = chenBreakdown(hand);
      const sum = b.steps.reduce((s, x) => s + x.delta, 0);
      expect(sum, hand).toBeCloseTo(b.raw, 10);
      expect(Math.ceil(b.raw)).toBe(b.score);
      expect(b.score).toBe(chenScore(hand));
    }
  });

  it('explains JTs and 22', () => {
    expect(chenBreakdown('JTs').steps.map((s) => s.delta)).toEqual([6, 2, 1]);
    expect(chenBreakdown('22').steps.map((s) => s.delta)).toEqual([2, 3]);
    expect(chenBreakdown('72o').steps.map((s) => s.delta)).toEqual([3.5, -5]);
  });

  it('strengthRank: AA is 1, 169 distinct ranks', () => {
    expect(strengthRank('AA')).toBe(1);
    expect(new Set(ORDERED_HANDS.map(strengthRank)).size).toBe(169);
  });
});

describe('parseHand', () => {
  it('rejects malformed classes', () => {
    for (const bad of ['AAs', 'AK', 'KAs', 'A1s', '', 'AKx']) expect(() => parseHand(bad)).toThrow();
  });
});

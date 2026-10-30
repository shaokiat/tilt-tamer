import { ALL_HANDS, parseHand, rankValue, type Rank } from './hands';
import type { Category } from './types';

const POINTS: Record<Rank, number> = {
  A: 10, K: 8, Q: 7, J: 6, T: 5, '9': 4.5, '8': 4, '7': 3.5, '6': 3, '5': 2.5, '4': 2, '3': 1.5, '2': 1,
};

function gapPenalty(gap: number): number {
  if (gap <= 0) return 0;
  if (gap === 1) return 1;
  if (gap === 2) return 2;
  if (gap === 3) return 4;
  return 5;
}

/** Chen formula, RANGES.md §3.2. Half points are rounded up. */
export function chenScore(hand: string): number {
  const { high, low, category } = parseHand(hand);
  if (category === 'pair') return Math.ceil(Math.max(5, POINTS[high] * 2));

  let score = POINTS[high];
  if (category === 'suited') score += 2;
  const gap = rankValue(high) - rankValue(low) - 1;
  score -= gapPenalty(gap);
  if (gap <= 1 && rankValue(high) < rankValue('Q')) score += 1;
  return Math.ceil(score);
}

const CATEGORY_ORDER: Record<Category, number> = { pair: 0, suited: 1, offsuit: 2 };

/**
 * Sort comparator, strongest first:
 * score desc, then pair > suited > offsuit, then high card desc, then low card desc.
 */
export function compareHands(a: string, b: string): number {
  const ds = chenScore(b) - chenScore(a);
  if (ds !== 0) return ds;
  const pa = parseHand(a);
  const pb = parseHand(b);
  const dc = CATEGORY_ORDER[pa.category] - CATEGORY_ORDER[pb.category];
  if (dc !== 0) return dc;
  const dh = rankValue(pb.high) - rankValue(pa.high);
  if (dh !== 0) return dh;
  return rankValue(pb.low) - rankValue(pa.low);
}

/** All 169 classes, strongest first. */
export const ORDERED_HANDS: string[] = [...ALL_HANDS].sort(compareHands);

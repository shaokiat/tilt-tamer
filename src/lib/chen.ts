import { ALL_HANDS, parseHand, rankValue, type Rank } from './hands';
import type { Category } from './types';

export const CHEN_POINTS: Record<Rank, number> = {
  A: 10, K: 8, Q: 7, J: 6, T: 5, '9': 4.5, '8': 4, '7': 3.5, '6': 3, '5': 2.5, '4': 2, '3': 1.5, '2': 1,
};

function gapPenalty(gap: number): number {
  if (gap <= 0) return 0;
  if (gap === 1) return 1;
  if (gap === 2) return 2;
  if (gap === 3) return 4;
  return 5;
}

export interface ChenStep {
  label: string;
  /** Points added (negative = subtracted). For the first step, the starting value. */
  delta: number;
}

export interface ChenBreakdown {
  hand: string;
  steps: ChenStep[];
  /** Sum before rounding. */
  raw: number;
  /** Final score (half points rounded up). */
  score: number;
}

const RANK_WORD: Record<Rank, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven',
  '6': 'Six', '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
};

/**
 * Chen formula, RANGES.md §3.2, as a list of human-readable steps.
 * chenScore() is derived from this, so the explanation can never disagree with the score.
 */
export function chenBreakdown(hand: string): ChenBreakdown {
  const { high, low, category } = parseHand(hand);
  const steps: ChenStep[] = [];
  let raw: number;

  if (category === 'pair') {
    const doubled = CHEN_POINTS[high] * 2;
    steps.push({ label: `Pair: ${RANK_WORD[high]} ${CHEN_POINTS[high]} × 2`, delta: doubled });
    raw = doubled;
    if (doubled < 5) {
      steps.push({ label: 'Pairs score at least 5', delta: 5 - doubled });
      raw = 5;
    }
  } else {
    raw = CHEN_POINTS[high];
    steps.push({ label: `High card: ${RANK_WORD[high]}`, delta: raw });
    if (category === 'suited') {
      steps.push({ label: 'Suited', delta: 2 });
      raw += 2;
    }
    const gap = rankValue(high) - rankValue(low) - 1;
    const pen = gapPenalty(gap);
    if (pen > 0) {
      steps.push({ label: `Gap of ${gap} rank${gap === 1 ? '' : 's'}${gap >= 4 ? ' (4+)' : ''}`, delta: -pen });
      raw -= pen;
    }
    if (gap <= 1 && rankValue(high) < rankValue('Q')) {
      steps.push({ label: `Straight bonus (${gap === 0 ? 'connected' : '1-gap'}, below Q)`, delta: 1 });
      raw += 1;
    }
  }

  return { hand, steps, raw, score: Math.ceil(raw) };
}

/** Chen formula, RANGES.md §3.2. Half points are rounded up. */
export function chenScore(hand: string): number {
  return chenBreakdown(hand).score;
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

const RANK_INDEX = new Map(ORDERED_HANDS.map((h, i) => [h, i + 1]));

/** 1 = strongest (AA) ... 169 = weakest, in the generator's ordering. */
export function strengthRank(hand: string): number {
  return RANK_INDEX.get(hand)!;
}

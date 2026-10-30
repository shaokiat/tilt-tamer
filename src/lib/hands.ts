import type { Category } from './types';

/** Ranks from strongest to weakest. Index 0 = Ace. Also the grid's row/column order. */
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = (typeof RANKS)[number];

export const TOTAL_COMBOS = 1326;

const COMBOS: Record<Category, number> = { pair: 6, suited: 4, offsuit: 12 };

/** Numeric rank: A=14 ... 2=2. */
export function rankValue(r: Rank): number {
  return 14 - RANKS.indexOf(r);
}

export function isRank(x: string): x is Rank {
  return (RANKS as readonly string[]).includes(x);
}

/**
 * Hand class at a 13x13 grid cell.
 * Diagonal = pairs, above the diagonal (col > row) = suited, below = offsuit.
 */
export function handAt(row: number, col: number): string {
  const a = RANKS[row];
  const b = RANKS[col];
  if (row === col) return a + a;
  if (col > row) return a + b + 's';
  return b + a + 'o';
}

export const GRID: string[][] = RANKS.map((_, r) => RANKS.map((_, c) => handAt(r, c)));

/** All 169 hand classes, in grid (row-major) order. */
export const ALL_HANDS: string[] = GRID.flat();

export interface ParsedHand {
  high: Rank;
  low: Rank;
  category: Category;
}

const HAND_RE = /^([AKQJT2-9])([AKQJT2-9])([so])?$/;

export function parseHand(hand: string): ParsedHand {
  const m = HAND_RE.exec(hand);
  if (!m) throw new Error(`Invalid hand class: ${hand}`);
  const [, a, b, suffix] = m as unknown as [string, Rank, Rank, 's' | 'o' | undefined];
  if (a === b) {
    if (suffix) throw new Error(`Pairs take no suffix: ${hand}`);
    return { high: a, low: b, category: 'pair' };
  }
  if (!suffix) throw new Error(`Non-pair needs s/o suffix: ${hand}`);
  if (rankValue(a) < rankValue(b)) throw new Error(`High card must come first: ${hand}`);
  return { high: a, low: b, category: suffix === 's' ? 'suited' : 'offsuit' };
}

export function isValidHand(hand: string): boolean {
  try {
    parseHand(hand);
    return true;
  } catch {
    return false;
  }
}

export function categoryOf(hand: string): Category {
  return parseHand(hand).category;
}

export function combos(hand: string): number {
  return COMBOS[categoryOf(hand)];
}

export function gridPosition(hand: string): { row: number; col: number } {
  const { high, low, category } = parseHand(hand);
  const h = RANKS.indexOf(high);
  const l = RANKS.indexOf(low);
  if (category === 'pair') return { row: h, col: h };
  if (category === 'suited') return { row: h, col: l };
  return { row: l, col: h };
}

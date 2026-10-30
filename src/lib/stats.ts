import type { Verdict } from './scoring';
import { CATEGORIES, POSITIONS, type Action, type Category, type Position } from './types';

export interface Attempt {
  hand: string;
  position: Position;
  category: Category;
  action: Action;
  verdict: Verdict;
  ts: number;
}

export interface Tally {
  correct: number;
  perfect: number;
  total: number;
}

export interface Leak extends Tally {
  position: Position;
  category: Category;
  accuracy: number;
}

export interface Stats {
  overall: Tally;
  byPosition: Record<Position, Tally>;
  byCategory: Record<Category, Tally>;
  leaks: Leak[];
  /** Most recent verdicts, oldest first. */
  recent: Verdict[];
}

export const MIN_LEAK_ATTEMPTS = 5;
export const MAX_LEAKS = 5;
export const RECENT_COUNT = 20;

const emptyTally = (): Tally => ({ correct: 0, perfect: 0, total: 0 });

function add(t: Tally, v: Verdict) {
  t.total += 1;
  if (v !== 'wrong') t.correct += 1;
  if (v === 'perfect') t.perfect += 1;
}

/** Accuracy = share of answers that were correct or perfect. null when no attempts. */
export function accuracy(t: Tally): number | null {
  return t.total ? t.correct / t.total : null;
}

export function computeStats(attempts: readonly Attempt[]): Stats {
  const overall = emptyTally();
  const byPosition = Object.fromEntries(POSITIONS.map((p) => [p, emptyTally()])) as Record<Position, Tally>;
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, emptyTally()])) as Record<Category, Tally>;
  const combo = new Map<string, Tally>();

  for (const a of attempts) {
    add(overall, a.verdict);
    add(byPosition[a.position], a.verdict);
    add(byCategory[a.category], a.verdict);
    const key = `${a.position}|${a.category}`;
    if (!combo.has(key)) combo.set(key, emptyTally());
    add(combo.get(key)!, a.verdict);
  }

  const leaks: Leak[] = [];
  for (const [key, t] of combo) {
    if (t.total < MIN_LEAK_ATTEMPTS) continue;
    const [position, category] = key.split('|') as [Position, Category];
    leaks.push({ ...t, position, category, accuracy: t.correct / t.total });
  }
  leaks.sort(
    (x, y) =>
      x.accuracy - y.accuracy ||
      y.total - x.total ||
      POSITIONS.indexOf(x.position) - POSITIONS.indexOf(y.position) ||
      CATEGORIES.indexOf(x.category) - CATEGORIES.indexOf(y.category),
  );

  return {
    overall,
    byPosition,
    byCategory,
    leaks: leaks.slice(0, MAX_LEAKS),
    recent: attempts.slice(-RECENT_COUNT).map((a) => a.verdict),
  };
}

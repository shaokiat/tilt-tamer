import { chenScore, strengthRank } from './chen';
import type { Freqs, Position, PositionRange } from './types';

/** Lowest Chen score that is still opened (raise > 0) in this range. */
export function chenCutoff(range: PositionRange): number | null {
  let min: number | null = null;
  for (const [hand, f] of Object.entries(range)) {
    if (f.raise > 0) {
      const s = chenScore(hand);
      if (min === null || s < min) min = s;
    }
  }
  return min;
}

/** Number of hand classes opened at all (raise > 0). */
export function openCount(range: PositionRange): number {
  return Object.values(range).filter((f) => f.raise > 0).length;
}

export type SpotKind = 'pure' | 'mixed' | 'fold';

export interface SpotExplanation {
  hand: string;
  position: Position;
  kind: SpotKind;
  score: number;
  cutoff: number | null;
  raisePct: number;
  /** 1 = strongest of 169. */
  rank: number;
  /** How many classes this position opens (incl. the boundary hand). */
  opens: number;
  /** Folded although its score equals the cutoff score (lost the tie-break). */
  lostTieBreak: boolean;
}

export function explainParts(hand: string, position: Position, freqs: Freqs, range: PositionRange): SpotExplanation {
  const kind: SpotKind = freqs.raise >= 1 ? 'pure' : freqs.raise <= 0 ? 'fold' : 'mixed';
  const score = chenScore(hand);
  const cutoff = chenCutoff(range);
  return {
    hand,
    position,
    kind,
    score,
    cutoff,
    raisePct: Math.round(freqs.raise * 100),
    rank: strengthRank(hand),
    opens: openCount(range),
    lostTieBreak: kind === 'fold' && cutoff !== null && score >= cutoff,
  };
}

/** One-line "why" (plain text), based on the Chen score and the range cutoff. */
export function explain(hand: string, position: Position, freqs: Freqs, range: PositionRange): string {
  const p = explainParts(hand, position, freqs, range);
  if (p.kind === 'pure') return `${hand} (Chen ${p.score}) is a pure open from ${position}.`;
  if (p.kind === 'fold') {
    if (p.cutoff === null) return `${hand} is not opened from ${position}.`;
    if (p.lostTieBreak) {
      return `${hand} (Chen ${p.score}) ties the ${position} cutoff score but loses the tie-break, so it folds.`;
    }
    return `${hand} (Chen ${p.score}) is below the ${position} cutoff (opens stop around Chen ${p.cutoff}).`;
  }
  return `${hand} (Chen ${p.score}) is the boundary hand at ${position}: raised ${p.raisePct}% of the time.`;
}

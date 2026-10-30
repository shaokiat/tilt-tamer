import { chenScore } from './chen';
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

/** One-line "why" for the feedback card, based on the Chen score and the range cutoff. */
export function explain(hand: string, position: Position, freqs: Freqs, range: PositionRange): string {
  const score = chenScore(hand);
  const pct = Math.round(freqs.raise * 100);
  if (freqs.raise >= 1) return `${hand} (Chen ${score}) is a pure open from ${position}.`;
  if (freqs.raise <= 0) {
    const cut = chenCutoff(range);
    return cut === null
      ? `${hand} is not opened from ${position}.`
      : `${hand} (Chen ${score}) is below the ${position} cutoff (opens stop around Chen ${cut}).`;
  }
  return `${hand} (Chen ${score}) is the boundary hand at ${position}: raised ${pct}% of the time.`;
}

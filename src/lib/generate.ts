import { ORDERED_HANDS } from './chen';
import { ALL_HANDS, combos, TOTAL_COMBOS } from './hands';
import { POSITIONS, type Position, type PositionRange, type RangesFile } from './types';

/** Target open % of all 1326 combos (RANGES.md §2). */
export const TARGETS: Record<Position, number> = { UTG: 16, HJ: 20, CO: 28, BTN: 45, SB: 40 };

const round4 = (x: number) => Math.round(x * 1e4) / 1e4;
const EPS = 1e-9;

/**
 * Walk hands strongest-first, accumulating combos until targetPct of 1326 is reached.
 * The boundary class gets a fractional raise frequency (RANGES.md §3.3).
 * Output keys are in grid order for a readable JSON file.
 */
export function buildRange(targetPct: number): PositionRange {
  const target = (targetPct / 100) * TOTAL_COMBOS;
  const byHand: PositionRange = {};
  let acc = 0;
  for (const hand of ORDERED_HANDS) {
    const c = combos(hand);
    const remaining = target - acc;
    let raise: number;
    if (remaining >= c - EPS) raise = 1;
    else if (remaining > EPS) raise = remaining / c;
    else raise = 0;
    acc += raise * c;
    const r = round4(raise);
    byHand[hand] = { raise: r, fold: round4(1 - r) };
  }
  const out: PositionRange = {};
  for (const hand of ALL_HANDS) out[hand] = byHand[hand];
  return out;
}

export function generateRanges(): RangesFile {
  const RFI = {} as RangesFile['RFI'];
  for (const pos of POSITIONS) RFI[pos] = buildRange(TARGETS[pos]);
  return {
    meta: { source: 'rule-generated', stack: '100bb', format: '6max-cash', version: 1 },
    RFI,
  };
}

/** Combo-weighted raise %, 0-100. */
export function raisePct(range: PositionRange): number {
  let total = 0;
  for (const [hand, f] of Object.entries(range)) total += f.raise * combos(hand);
  return (total / TOTAL_COMBOS) * 100;
}

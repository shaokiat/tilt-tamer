import { describe, expect, it } from 'vitest';
import rangesJson from '../src/data/ranges.json';
import { chenScore } from '../src/lib/chen';
import { chenCutoff, explain, explainParts, openCount } from '../src/lib/explain';
import { ALL_HANDS } from '../src/lib/hands';
import { POSITIONS, type RangesFile } from '../src/lib/types';

const data = rangesJson as RangesFile;

describe('explain', () => {
  it('pure open / fold / boundary wording', () => {
    const co = data.RFI.CO;
    expect(explain('AA', 'CO', co.AA, co)).toMatch(/pure open from CO/);
    expect(explain('72o', 'CO', co['72o'], co)).toMatch(/below the CO cutoff/);
    const boundary = ALL_HANDS.find((h) => co[h].raise > 0 && co[h].raise < 1)!;
    expect(explain(boundary, 'CO', co[boundary], co)).toMatch(/boundary hand at CO/);
  });

  it('never says "below the cutoff" for a hand whose score equals the cutoff', () => {
    for (const pos of POSITIONS) {
      const r = data.RFI[pos];
      const cut = chenCutoff(r)!;
      for (const h of ALL_HANDS) {
        if (r[h].raise > 0) continue;
        const text = explain(h, pos, r[h], r);
        if (chenScore(h) >= cut) expect(text, `${pos} ${h}`).toMatch(/tie-break/);
        else expect(text).toMatch(/below the/);
      }
    }
  });

  it('a tie-break fold exists (K5s at CO: same score as the K6s boundary)', () => {
    const co = data.RFI.CO;
    expect(co.K6s.raise).toBeGreaterThan(0);
    expect(co.K5s.raise).toBe(0);
    expect(explainParts('K5s', 'CO', co.K5s, co).lostTieBreak).toBe(true);
  });

  it('openCount matches the classes with raise > 0', () => {
    expect(openCount(data.RFI.UTG)).toBe(40);
    expect(openCount(data.RFI.BTN)).toBe(91);
  });
});

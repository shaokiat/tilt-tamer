import { describe, expect, it } from 'vitest';
import rangesJson from '../src/data/ranges.json';
import { ORDERED_HANDS } from '../src/lib/chen';
import { generateRanges, raisePct, TARGETS } from '../src/lib/generate';
import { ALL_HANDS, categoryOf, combos, gridPosition, GRID, handAt, RANKS, TOTAL_COMBOS } from '../src/lib/hands';
import { POSITIONS, type RangesFile } from '../src/lib/types';

const data = rangesJson as RangesFile;
const EPS = 1e-9;

describe('ranges.json (committed output)', () => {
  it('matches the generator exactly (no drift between script and file)', () => {
    expect(data).toEqual(generateRanges());
  });

  it('has the schema meta from RANGES.md §5', () => {
    expect(data.meta).toEqual({ source: 'rule-generated', stack: '100bb', format: '6max-cash', version: 1 });
    expect(Object.keys(data.RFI).sort()).toEqual([...POSITIONS].sort());
  });
});

describe('§6.1 169 classes per position, freqs in [0,1], raise + fold = 1', () => {
  for (const pos of POSITIONS) {
    it(pos, () => {
      const range = data.RFI[pos];
      expect(Object.keys(range)).toHaveLength(169);
      expect(new Set(Object.keys(range))).toEqual(new Set(ALL_HANDS));
      for (const [hand, f] of Object.entries(range)) {
        expect(Object.keys(f).sort(), hand).toEqual(['fold', 'raise']);
        expect(f.raise).toBeGreaterThanOrEqual(0);
        expect(f.raise).toBeLessThanOrEqual(1);
        expect(f.fold).toBeGreaterThanOrEqual(0);
        expect(f.fold).toBeLessThanOrEqual(1);
        expect(Math.abs(f.raise + f.fold - 1), hand).toBeLessThan(EPS);
      }
    });
  }
});

describe('§6.2 combo-weighted raise % within 0.5 of target', () => {
  for (const pos of POSITIONS) {
    it(`${pos} ≈ ${TARGETS[pos]}%`, () => {
      expect(Math.abs(raisePct(data.RFI[pos]) - TARGETS[pos])).toBeLessThanOrEqual(0.5);
    });
  }
});

describe('§6.3 nesting: raise(UTG) <= raise(HJ) <= raise(CO) <= raise(BTN)', () => {
  const chain = ['UTG', 'HJ', 'CO', 'BTN'] as const;
  it('holds for every hand', () => {
    for (const hand of ALL_HANDS) {
      for (let i = 1; i < chain.length; i++) {
        expect(data.RFI[chain[i - 1]][hand].raise, `${hand} ${chain[i - 1]}->${chain[i]}`).toBeLessThanOrEqual(
          data.RFI[chain[i]][hand].raise,
        );
      }
    }
  });
});

describe('§6.4 pairs: higher pairs open at least as often as lower pairs', () => {
  const pairs = RANKS.map((r) => r + r); // AA ... 22
  for (const pos of POSITIONS) {
    it(pos, () => {
      for (let i = 1; i < pairs.length; i++) {
        expect(data.RFI[pos][pairs[i - 1]].raise, `${pairs[i - 1]} vs ${pairs[i]}`).toBeGreaterThanOrEqual(
          data.RFI[pos][pairs[i]].raise,
        );
      }
      if (data.RFI[pos]['77'].raise > 0) {
        for (const p of ['88', '99', 'TT', 'JJ', 'QQ', 'KK', 'AA']) {
          expect(data.RFI[pos][p].raise).toBeGreaterThanOrEqual(data.RFI[pos]['77'].raise);
        }
      }
    });
  }
});

describe('§6.5 suited dominance: raise(XYs) >= raise(XYo)', () => {
  for (const pos of POSITIONS) {
    it(pos, () => {
      for (const hand of ALL_HANDS.filter((h) => h.endsWith('s'))) {
        const off = hand.slice(0, 2) + 'o';
        expect(data.RFI[pos][hand].raise, `${hand} vs ${off}`).toBeGreaterThanOrEqual(data.RFI[pos][off].raise);
      }
    });
  }
});

describe('§6.6 combo counts 6 / 4 / 12; total 1326', () => {
  it('per class', () => {
    const counts = { pair: 0, suited: 0, offsuit: 0 };
    for (const hand of ALL_HANDS) {
      const c = categoryOf(hand);
      counts[c] += 1;
      expect(combos(hand)).toBe({ pair: 6, suited: 4, offsuit: 12 }[c]);
    }
    expect(counts).toEqual({ pair: 13, suited: 78, offsuit: 78 });
  });
  it('total', () => {
    expect(ALL_HANDS.reduce((s, h) => s + combos(h), 0)).toBe(TOTAL_COMBOS);
    expect(TOTAL_COMBOS).toBe(1326);
  });
});

describe('§6.7 grid layout: pairs on diagonal, suited above, offsuit below', () => {
  it('every cell', () => {
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const hand = GRID[r][c];
        const cat = categoryOf(hand);
        if (r === c) expect(cat).toBe('pair');
        else if (c > r) expect(cat).toBe('suited');
        else expect(cat).toBe('offsuit');
        expect(gridPosition(hand)).toEqual({ row: r, col: c });
      }
    }
  });
  it('spot checks: AA diagonal, AKs above, AKo below', () => {
    expect(handAt(0, 0)).toBe('AA');
    expect(handAt(0, 1)).toBe('AKs');
    expect(handAt(1, 0)).toBe('AKo');
    expect(handAt(12, 12)).toBe('22');
    expect(gridPosition('72o')).toEqual({ row: 12, col: 7 });
    expect(gridPosition('72s')).toEqual({ row: 7, col: 12 });
    expect(new Set(GRID.flat()).size).toBe(169);
  });
});

describe('§3.3 boundary hand', () => {
  it('each position has at most one fractional class, and it is the boundary in Chen order', () => {
    for (const pos of POSITIONS) {
      const range = data.RFI[pos];
      const fractional = ALL_HANDS.filter((h) => range[h].raise > 0 && range[h].raise < 1);
      expect(fractional.length, pos).toBeLessThanOrEqual(1);
      // Ordered list must be 1...1, [fraction], 0...0
      const seq = ORDERED_HANDS.map((h) => range[h].raise);
      for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeLessThanOrEqual(seq[i - 1]);
    }
  });
});

import { memo } from 'react';
import { chenScore } from '../lib/chen';
import { GRID, RANKS } from '../lib/hands';
import type { PositionRange } from '../lib/types';

interface Props {
  range: PositionRange;
  highlight: string;
  revealed: boolean;
}

/**
 * 13x13 chart. Rows/columns go A..2. Diagonal = pairs, above = suited, below = offsuit.
 * Each cell fills from the bottom in proportion to its raise frequency.
 */
export const RangeGrid = memo(function RangeGrid({ range, highlight, revealed }: Props) {
  return (
    <div className={`grid-wrap ${revealed ? 'is-revealed' : 'is-hidden'}`}>
      <table className="grid" data-testid="grid">
        <caption className="sr-only">Opening range. Rows are the first card, columns the second. Suited hands above the diagonal, offsuit below.</caption>
        <thead>
          <tr>
            <th aria-hidden />
            {RANKS.map((r) => (
              <th key={r} scope="col">
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRID.map((row, r) => (
            <tr key={RANKS[r]}>
              <th scope="row">{RANKS[r]}</th>
              {row.map((hand, c) => {
                const f = range[hand]?.raise ?? 0;
                const pct = Math.round(f * 100);
                const kind = r === c ? 'pair' : c > r ? 'suited' : 'offsuit';
                const mixed = f > 0 && f < 1;
                const isDealt = hand === highlight;
                return (
                  <td
                    key={hand}
                    className={`cell cell-${kind} ${isDealt ? 'is-dealt' : ''} ${mixed ? 'is-mixed' : ''}`}
                    data-hand={hand}
                    data-row={r}
                    data-col={c}
                    data-raise={revealed ? f : undefined}
                    title={revealed ? `${hand} · raise ${pct}% · Chen ${chenScore(hand)}` : hand}
                    style={{ ['--f' as string]: revealed ? f : 0, ['--d' as string]: `${(r + c) * 10}ms` }}
                    aria-label={revealed ? `${hand}, raise ${pct}%` : hand}
                    aria-current={isDealt ? 'true' : undefined}
                  >
                    <span className="cell-fill" />
                    <span className="cell-label">{hand}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid-foot">
        <span className="legend">
          <i className="sw sw-raise" /> raise
        </span>
        <span className="legend">
          <i className="sw sw-mixed" /> mixed
        </span>
        <span className="legend">
          <i className="sw sw-fold" /> fold
        </span>
        <span className="legend">
          <i className="sw sw-dealt" /> your hand
        </span>
        {!revealed && <span className="grid-hint muted">Answer to reveal the range</span>}
      </div>
    </div>
  );
});

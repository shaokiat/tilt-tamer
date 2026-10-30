import { memo, useCallback, useMemo, useRef, useState, type MouseEvent } from 'react';
import { chenScore, strengthRank } from '../lib/chen';
import { chenCutoff, openCount } from '../lib/explain';
import { categoryOf, GRID, RANKS } from '../lib/hands';
import type { Position, PositionRange } from '../lib/types';
import { ChenBreakdownView } from './Explainers';

interface Props {
  range: PositionRange;
  position: Position;
  highlight: string;
  revealed: boolean;
}

interface Hover {
  hand: string;
  x: number;
  y: number;
  below: boolean;
}

const CARD_W = 260;

/**
 * 13x13 chart. Rows/columns go A..2. Diagonal = pairs, above = suited, below = offsuit.
 * Each cell fills from the bottom in proportion to its raise frequency.
 * Hovering a cell (once the range is revealed) shows how its score and frequency were derived.
 */
export function RangeGrid({ range, position, highlight, revealed }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const onOver = useCallback((e: MouseEvent) => {
    const td = (e.target as HTMLElement).closest<HTMLElement>('td[data-hand]');
    const wrap = wrapRef.current;
    if (!td || !wrap) return;
    const hand = td.dataset.hand!;
    setHover((h) => {
      if (h?.hand === hand) return h;
      const w = wrap.getBoundingClientRect();
      const c = td.getBoundingClientRect();
      const half = CARD_W / 2;
      const cx = c.left - w.left + c.width / 2;
      const below = Number(td.dataset.row) < 5;
      return {
        hand,
        x: Math.min(Math.max(cx, half), w.width - half),
        y: below ? c.bottom - w.top + 6 : c.top - w.top - 6,
        below,
      };
    });
  }, []);
  const onLeave = useCallback(() => setHover(null), []);

  return (
    <div ref={wrapRef} className={`grid-wrap ${revealed ? 'is-revealed' : 'is-hidden'}`}>
      <GridTable range={range} highlight={highlight} revealed={revealed} onOver={onOver} onLeave={onLeave} />
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
        <span className="grid-hint muted">{revealed ? 'Hover a cell for the working' : 'Answer to reveal the range'}</span>
      </div>
      {revealed && hover && <CellCard hover={hover} range={range} position={position} />}
    </div>
  );
}

const GridTable = memo(function GridTable({
  range,
  highlight,
  revealed,
  onOver,
  onLeave,
}: {
  range: PositionRange;
  highlight: string;
  revealed: boolean;
  onOver: (e: MouseEvent) => void;
  onLeave: () => void;
}) {
  return (
    <table className="grid" data-testid="grid" onMouseOver={onOver} onMouseLeave={onLeave}>
      <caption className="sr-only">
        Opening range. Rows are the first card, columns the second. Suited hands above the diagonal, offsuit below.
      </caption>
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
  );
});

const KIND_LABEL = { pair: 'pair', suited: 'suited', offsuit: 'offsuit' } as const;

function CellCard({ hover, range, position }: { hover: Hover; range: PositionRange; position: Position }) {
  const { hand } = hover;
  const f = range[hand].raise;
  const pct = Math.round(f * 100);
  const opens = useMemo(() => openCount(range), [range]);
  const cutoff = useMemo(() => chenCutoff(range), [range]);
  const rank = strengthRank(hand);
  const status = f >= 1 ? 'open' : f <= 0 ? 'fold' : 'mixed';

  return (
    <div
      className={`cell-card ${hover.below ? 'is-below' : 'is-above'}`}
      style={{ left: hover.x, top: hover.y, width: CARD_W }}
      data-testid="cell-card"
      role="tooltip"
    >
      <div className="cell-card-head">
        <span>
          <b>{hand}</b> <span className="muted">{KIND_LABEL[categoryOf(hand)]}</span>
        </span>
        <span className={`badge badge-${status}`}>
          {status === 'open' ? 'Raise 100%' : status === 'fold' ? 'Fold 100%' : `Raise ${pct}%`}
        </span>
      </div>
      <ChenBreakdownView hand={hand} title={false} />
      <div className="cell-card-foot">
        Strength <b>#{rank}</b> of 169. {position} opens the top <b>{opens}</b>
        {cutoff !== null && <> (down to Chen {cutoff})</>}.{' '}
        {status === 'mixed' && <>This is the boundary hand, mixed so the range hits its target exactly.</>}
        {status === 'open' && <>Inside the range.</>}
        {status === 'fold' &&
          (cutoff !== null && chenScore(hand) >= cutoff ? (
            <>Same score as the cutoff but loses the tie-break (pair &gt; suited &gt; offsuit, then higher cards).</>
          ) : (
            <>Outside the range.</>
          ))}
      </div>
    </div>
  );
}

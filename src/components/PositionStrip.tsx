import { POSITIONS, type Position } from '../lib/types';

const SEATS = [...POSITIONS, 'BB'] as const;

type SeatState = 'folded' | 'hero' | 'waiting';

const NOTE: Record<SeatState, string> = { folded: 'Folded', hero: 'You', waiting: 'To act' };
const ICON: Record<SeatState, string> = { folded: '✕', hero: '★', waiting: '…' };

interface Props {
  position: Position;
}

/**
 * Table seats in preflop action order. Everyone before hero has folded (that is what RFI means);
 * everyone after is still to act. Each state has its own colour, icon and label so it reads at a glance.
 */
export function PositionStrip({ position }: Props) {
  const heroIdx = SEATS.indexOf(position);
  const folded = SEATS.slice(0, heroIdx);
  const behind = SEATS.slice(heroIdx + 1);

  return (
    <div className="seats-wrap">
      <ol className="seats" aria-label={`You are in ${position}`} data-testid="position">
        {SEATS.map((seat, i) => {
          const state: SeatState = i === heroIdx ? 'hero' : i < heroIdx ? 'folded' : 'waiting';
          return (
            <li
              key={seat}
              className={`seat is-${state}`}
              data-state={state}
              aria-current={state === 'hero' ? 'true' : undefined}
              aria-label={`${seat}: ${NOTE[state]}`}
            >
              <span className="seat-icon" aria-hidden>
                {ICON[state]}
              </span>
              <span className="seat-name">{seat}</span>
              <span className="seat-note">{NOTE[state]}</span>
            </li>
          );
        })}
      </ol>
      <p className="seats-summary" data-testid="seats-summary">
        {folded.length === 0 ? (
          <>
            <span className="sum-hero">You are first to act</span>
          </>
        ) : (
          <>
            <span className="sum-folded">
              {folded.join(', ')} folded
            </span>
          </>
        )}
        <span className="sum-sep" aria-hidden>
          ·
        </span>
        <span className="sum-waiting">
          {behind.length} still to act ({behind.join(', ')})
        </span>
      </p>
    </div>
  );
}

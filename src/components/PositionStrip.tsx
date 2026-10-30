import { POSITIONS, type Position } from '../lib/types';

const SEATS = [...POSITIONS, 'BB'] as const;

interface Props {
  position: Position;
}

/** Table seats in action order. Seats before hero have folded; BB has no RFI spot. */
export function PositionStrip({ position }: Props) {
  const heroIdx = SEATS.indexOf(position);
  return (
    <ol className="seats" aria-label={`You are in ${position}`} data-testid="position">
      {SEATS.map((seat, i) => {
        const state = seat === position ? 'hero' : i < heroIdx ? 'folded' : 'waiting';
        return (
          <li key={seat} className={`seat is-${state}`} aria-current={state === 'hero' ? 'true' : undefined}>
            <span className="seat-name">{seat}</span>
            <span className="seat-note">{state === 'hero' ? 'you' : state === 'folded' ? 'fold' : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

import type { Card, Deal } from '../lib/deal';

const SUIT_GLYPH = { s: '♠', h: '♥', d: '♦', c: '♣' } as const;
const SUIT_NAME = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' } as const;
const RANK_NAME: Record<string, string> = { A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: 'Ten' };

function PlayingCard({ card, delay }: { card: Card; delay: number }) {
  const red = card.suit === 'h' || card.suit === 'd';
  const rank = card.rank === 'T' ? '10' : card.rank;
  return (
    <div
      className={`card ${red ? 'is-red' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${RANK_NAME[card.rank] ?? card.rank} of ${SUIT_NAME[card.suit]}`}
      role="img"
    >
      <span className="card-corner">
        {rank}
        <br />
        {SUIT_GLYPH[card.suit]}
      </span>
      <span className="card-pip">{SUIT_GLYPH[card.suit]}</span>
    </div>
  );
}

interface Props {
  deal: Deal;
  dealId: number;
}

export function HandDisplay({ deal, dealId }: Props) {
  return (
    <div className="hand" key={dealId}>
      <div className="cards">
        <PlayingCard card={deal.cards[0]} delay={0} />
        <PlayingCard card={deal.cards[1]} delay={70} />
      </div>
      <div className="hand-meta">
        <span className="hand-class" data-testid="hand">
          {deal.hand}
        </span>
        <span className="muted small">Folded to you in {deal.position}. Open or fold?</span>
      </div>
    </div>
  );
}

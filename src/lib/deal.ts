import { RANKS, type Rank } from './hands';
import type { Rng } from './rng';
import { POSITIONS, type Position } from './types';

export const SUITS = ['s', 'h', 'd', 'c'] as const;
export type Suit = (typeof SUITS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface Deal {
  position: Position;
  hand: string;
  /** Higher card first. */
  cards: [Card, Card];
}

const pick = (rng: Rng, n: number) => Math.min(n - 1, Math.floor(rng() * n));

/** Card index 0..51: rank = RANKS[i / 4], suit = SUITS[i % 4]. */
function cardFromIndex(i: number): Card {
  return { rank: RANKS[Math.floor(i / 4)], suit: SUITS[i % 4] };
}

/** Two distinct cards, uniform over all 1326 combos. Higher card first. */
export function dealCards(rng: Rng = Math.random): [Card, Card] {
  const a = pick(rng, 52);
  let b = pick(rng, 51);
  if (b >= a) b += 1;
  const [hi, lo] = a < b ? [a, b] : [b, a];
  return [cardFromIndex(hi), cardFromIndex(lo)];
}

/** Hand class for two cards, e.g. AKs / AKo / QQ. */
export function handClassOf(c1: Card, c2: Card): string {
  const [hi, lo] = RANKS.indexOf(c1.rank) <= RANKS.indexOf(c2.rank) ? [c1, c2] : [c2, c1];
  if (hi.rank === lo.rank) return hi.rank + lo.rank;
  return hi.rank + lo.rank + (hi.suit === lo.suit ? 's' : 'o');
}

export function dealHand(rng: Rng = Math.random, positions: readonly Position[] = POSITIONS): Deal {
  const position = positions[pick(rng, positions.length)];
  const cards = dealCards(rng);
  return { position, cards, hand: handClassOf(cards[0], cards[1]) };
}

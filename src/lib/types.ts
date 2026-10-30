export const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type Position = (typeof POSITIONS)[number];

export const ACTIONS = ['fold', 'raise'] as const;
export type Action = (typeof ACTIONS)[number];

export const CATEGORIES = ['pair', 'suited', 'offsuit'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Freqs = Record<Action, number>;
export type PositionRange = Record<string, Freqs>;

export interface RangesMeta {
  source: string;
  stack: string;
  format: string;
  version: number;
}

export interface RangesFile {
  meta: RangesMeta;
  RFI: Record<Position, PositionRange>;
}

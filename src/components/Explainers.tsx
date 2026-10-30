import { chenBreakdown } from '../lib/chen';
import { TARGETS } from '../lib/generate';
import { POSITIONS } from '../lib/types';

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const signed = (n: number) => (n >= 0 ? `+${fmt(n)}` : `−${fmt(-n)}`);

/** Step-by-step Chen score for one hand. */
export function ChenBreakdownView({ hand, title = true }: { hand: string; title?: boolean }) {
  const b = chenBreakdown(hand);
  const rounding = b.score - b.raw;
  return (
    <span className="chen" data-testid="chen-breakdown">
      {title && (
        <span className="chen-title">
          Chen score for <b>{hand}</b>
        </span>
      )}
      <span className="chen-steps">
        {b.steps.map((s, i) => (
          <span className="chen-row" key={i}>
            <span>{s.label}</span>
            <span className="num">{i === 0 ? fmt(s.delta) : signed(s.delta)}</span>
          </span>
        ))}
        {rounding > 0 && (
          <span className="chen-row is-muted">
            <span>Round half up ({fmt(b.raw)} → {b.score})</span>
            <span className="num">{signed(rounding)}</span>
          </span>
        )}
        <span className="chen-row is-total">
          <span>Score</span>
          <span className="num">{b.score}</span>
        </span>
      </span>
    </span>
  );
}

/** The whole method on one card: Chen formula, range building, scoring. */
export function HowItWorks() {
  return (
    <span className="how" data-testid="how-it-works">
      <span className="how-h">1 · Score every hand (Chen formula)</span>
      <span className="how-grid">
        <span>High card</span>
        <span>A 10 · K 8 · Q 7 · J 6 · T 5 · 9 4.5 … 2 1</span>
        <span>Pair</span>
        <span>double it (minimum 5)</span>
        <span>Suited</span>
        <span>+2</span>
        <span>Gap</span>
        <span>1 → −1 · 2 → −2 · 3 → −4 · 4+ → −5</span>
        <span>Straight bonus</span>
        <span>+1 if gap is 0–1 and high card below Q</span>
        <span>Rounding</span>
        <span>half points round up</span>
      </span>
      <span className="how-ex">
        e.g. <b>JTs</b> = 6 + 2 + 1 = 9 · <b>AKo</b> = 10 · <b>22</b> = 5 · <b>72o</b> = −1
      </span>

      <span className="how-h">2 · Rank and cut</span>
      <span className="how-p">
        All 169 hands are sorted by score (ties: pair &gt; suited &gt; offsuit, then higher cards). Each position
        opens from the top until it covers its share of the 1326 combos:
      </span>
      <span className="how-targets">
        {POSITIONS.map((p) => (
          <span key={p}>
            <b>{p}</b> {TARGETS[p]}%
          </span>
        ))}
      </span>
      <span className="how-p">The hand on the boundary gets a mixed frequency so the total is exact.</span>

      <span className="how-h">3 · Scoring your answer</span>
      <span className="how-p">
        <b className="c-correct">Correct</b> if the action is played ≥ 20% of the time ·{' '}
        <b className="c-perfect">Perfect</b> if it is the most frequent action.
      </span>
      <span className="how-foot">Chen is a quick heuristic, not solver output.</span>
    </span>
  );
}

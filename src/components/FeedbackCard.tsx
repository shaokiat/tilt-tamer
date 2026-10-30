import type { RefObject } from 'react';
import type { SpotExplanation } from '../lib/explain';
import { formatFreqs, freqPercents, type ScoreResult, type Verdict } from '../lib/scoring';
import { ChenBreakdownView } from './Explainers';
import { Tip } from './Tip';

const VERDICT: Record<Verdict, { icon: string; label: string }> = {
  perfect: { icon: '★', label: 'Perfect' },
  correct: { icon: '✓', label: 'Correct' },
  wrong: { icon: '✗', label: 'Wrong' },
};

interface Props {
  result: ScoreResult | null;
  spot: SpotExplanation | null;
  onNext: () => void;
  nextRef: RefObject<HTMLButtonElement | null>;
  autoAdvance: boolean;
}

export function FeedbackCard({ result, spot, onNext, nextRef, autoAdvance }: Props) {
  // The slot is always rendered (fixed min-height) so nothing shifts when feedback appears.
  return (
    <div className="feedback-slot" aria-live="polite">
      {result ? (
        <div className={`feedback is-${result.verdict}`} data-testid="feedback">
          <div className="feedback-head">
            <span className="verdict" data-testid="verdict">
              <span aria-hidden>{VERDICT[result.verdict].icon}</span> {VERDICT[result.verdict].label}
            </span>
            <span className="muted small" data-testid="freqs">
              {formatFreqs(result.freqs)}
            </span>
          </div>
          <FreqBars result={result} />
          {spot && <WhyLine spot={spot} />}
          <button type="button" className="btn btn-next" onClick={onNext} ref={nextRef} data-testid="btn-next">
            Next hand <kbd>Space</kbd>
          </button>
          {autoAdvance && result.verdict === 'perfect' && <div className="auto-bar" aria-hidden />}
        </div>
      ) : (
        <div className="feedback-placeholder muted">
          <span className="hint-keys">
            Press <kbd>F</kbd> to fold or <kbd>R</kbd> to raise
          </span>
          <span className="hint-touch">Tap Fold or Raise</span>
        </div>
      )}
    </div>
  );
}

/** "Why" sentence; the Chen score and the cutoff are hoverable for the full working. */
function WhyLine({ spot }: { spot: SpotExplanation }) {
  const { hand, position, kind, score, cutoff, raisePct, rank, opens, lostTieBreak } = spot;
  const chen = (
    <Tip content={<ChenBreakdownView hand={hand} />} placement="top" align="start" className="term">
      Chen {score}
    </Tip>
  );
  const cut = (
    <Tip
      content={
        <span className="tip-text">
          {position} opens the strongest <b>{opens}</b> of 169 hands by Chen order. <b>{hand}</b> ranks{' '}
          <b>#{rank}</b>.
        </span>
      }
      placement="top"
      align="center"
      className="term"
    >
      {lostTieBreak ? 'tie-break' : `cutoff${cutoff !== null ? ` (Chen ${cutoff})` : ''}`}
    </Tip>
  );

  return (
    <div className="why" data-testid="why">
      <b>{hand}</b> ({chen}){' '}
      {kind === 'pure' && <>is a pure open from {position}: inside the top {opens} hands (ranked #{rank}).</>}
      {kind === 'mixed' && (
        <>
          is the boundary hand at {position}: raised {raisePct}% so the range totals its exact target.
        </>
      )}
      {kind === 'fold' &&
        (lostTieBreak ? (
          <>ties the {position} cutoff score but loses the {cut}, so it folds.</>
        ) : (
          <>is below the {position} {cut}, so it folds.</>
        ))}
    </div>
  );
}

function FreqBars({ result }: { result: ScoreResult }) {
  const p = freqPercents(result.freqs);
  return (
    <div className="freq-bars">
      {(['raise', 'fold'] as const).map((a) => (
        <div key={a} className={`freq-row ${result.action === a ? 'is-chosen' : ''}`}>
          <span className="freq-label">{a === 'raise' ? 'Raise' : 'Fold'}</span>
          <span className="freq-track">
            <span className={`freq-fill fill-${a}`} style={{ width: `${p[a]}%` }} />
          </span>
          <span className="freq-pct">{p[a]}%</span>
        </div>
      ))}
    </div>
  );
}

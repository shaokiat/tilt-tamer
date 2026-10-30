import type { RefObject } from 'react';
import { formatFreqs, freqPercents, type ScoreResult, type Verdict } from '../lib/scoring';

const VERDICT: Record<Verdict, { icon: string; label: string }> = {
  perfect: { icon: '★', label: 'Perfect' },
  correct: { icon: '✓', label: 'Correct' },
  wrong: { icon: '✗', label: 'Wrong' },
};

interface Props {
  result: ScoreResult | null;
  explanation: string;
  onNext: () => void;
  nextRef: RefObject<HTMLButtonElement | null>;
  autoAdvance: boolean;
}

export function FeedbackCard({ result, explanation, onNext, nextRef, autoAdvance }: Props) {
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
          <p className="why">{explanation}</p>
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

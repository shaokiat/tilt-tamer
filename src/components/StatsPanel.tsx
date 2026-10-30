import { useEffect, useState } from 'react';
import { accuracy, MAX_LEAKS, MIN_LEAK_ATTEMPTS, type Stats, type Tally } from '../lib/stats';
import { Tip } from './Tip';
import { CATEGORIES, POSITIONS, type Category } from '../lib/types';

const CATEGORY_LABEL: Record<Category, string> = { pair: 'Pairs', suited: 'Suited', offsuit: 'Offsuit' };

const pctText = (t: Tally) => {
  const a = accuracy(t);
  return a === null ? '–' : `${Math.round(a * 100)}%`;
};

const tone = (t: Tally) => {
  const a = accuracy(t);
  if (a === null) return 'none';
  if (a >= 0.85) return 'good';
  if (a >= 0.65) return 'ok';
  return 'bad';
};

function BarRow({ label, t, testId }: { label: string; t: Tally; testId: string }) {
  const a = accuracy(t);
  return (
    <div className="bar-row" data-testid={testId}>
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className={`bar-fill tone-${tone(t)}`} style={{ width: `${(a ?? 0) * 100}%` }} />
      </span>
      <span className="bar-value">{pctText(t)}</span>
      <span className="bar-n muted">{t.total}</span>
    </div>
  );
}

interface Props {
  stats: Stats;
  onReset: () => void;
}

export function StatsPanel({ stats, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 5000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const { overall } = stats;
  const perfectRate = overall.total ? Math.round((overall.perfect / overall.total) * 100) : null;

  return (
    <section className="panel stats" aria-label="Stats">
      <div className="panel-head">
        <h2>Stats</h2>
        <button
          type="button"
          className={`btn btn-ghost btn-sm ${confirming ? 'is-danger' : ''}`}
          onClick={() => {
            if (confirming) {
              onReset();
              setConfirming(false);
            } else setConfirming(true);
          }}
          disabled={overall.total === 0}
          data-testid="btn-reset"
        >
          {confirming ? 'Click again to reset' : 'Reset'}
        </button>
      </div>

      <div className="overall">
        <div>
          <div className={`big tone-text-${tone(overall)}`} data-testid="overall-acc">
            {pctText(overall)}
          </div>
          <div className="muted small">
            accuracy · <span data-testid="overall-n">{overall.total}</span> hands
            {perfectRate !== null && <> · {perfectRate}% perfect</>}
          </div>
        </div>
        <ol className="recent" aria-label="Last 20 answers">
          {stats.recent.map((v, i) => (
            <li key={i} className={`dot is-${v}`} title={v} />
          ))}
        </ol>
      </div>

      <div className="stats-body">
      <div className="stat-group">
        <h3>By position</h3>
        {POSITIONS.map((p) => (
          <BarRow key={p} label={p} t={stats.byPosition[p]} testId={`pos-${p}`} />
        ))}
      </div>

      <div className="stat-group">
        <h3>By hand type</h3>
        {CATEGORIES.map((c) => (
          <BarRow key={c} label={CATEGORY_LABEL[c]} t={stats.byCategory[c]} testId={`cat-${c}`} />
        ))}
      </div>

      <div className="stat-group">
        <h3>
          <Tip
            placement="top"
            align="start"
            className="term-quiet leaks-tip"
            label="How leaks are calculated"
            content={
              <span className="tip-text" data-testid="leaks-help">
                Every answer is grouped by <b>position + hand type</b> (e.g. SB · offsuit). Groups with at least{' '}
                <b>{MIN_LEAK_ATTEMPTS} attempts</b> are ranked by accuracy, lowest first, and the <b>{MAX_LEAKS}</b>{' '}
                weakest are listed. Ties go to the group with more attempts. Accuracy counts Correct and Perfect as right.
              </span>
            }
          >
            Leaks <span aria-hidden>ⓘ</span>
          </Tip>
        </h3>
        {stats.leaks.length === 0 ? (
          <p className="muted small">
            Need at least {MIN_LEAK_ATTEMPTS} attempts in a position + hand-type combo.
          </p>
        ) : (
          <ol className="leaks" data-testid="leaks">
            {stats.leaks.map((l) => (
              <li key={`${l.position}-${l.category}`}>
                <span className="leak-name">
                  {l.position} · {CATEGORY_LABEL[l.category].toLowerCase()}
                </span>
                <span className={`leak-acc tone-text-${tone(l)}`}>{Math.round(l.accuracy * 100)}%</span>
                <span className="muted small">
                  {l.correct}/{l.total}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      </div>
    </section>
  );
}

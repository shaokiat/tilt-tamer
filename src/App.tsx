import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import rangesData from './data/ranges.json';
import { ActionBar } from './components/ActionBar';
import { FeedbackCard } from './components/FeedbackCard';
import { HandDisplay } from './components/HandDisplay';
import { Header } from './components/Header';
import { PositionStrip } from './components/PositionStrip';
import { RangeGrid } from './components/RangeGrid';
import { SettingsBar } from './components/SettingsBar';
import { StatsPanel } from './components/StatsPanel';
import { dealHand, type Deal } from './lib/deal';
import { explain } from './lib/explain';
import { raisePct } from './lib/generate';
import { categoryOf } from './lib/hands';
import { scoreAnswer, type ScoreResult } from './lib/scoring';
import { computeStats, type Attempt } from './lib/stats';
import { loadAttempts, loadSettings, MAX_STORED, saveAttempts, saveSettings, type Settings } from './lib/storage';
import type { Action, RangesFile } from './lib/types';

const ranges = rangesData as RangesFile;
const AUTO_ADVANCE_MS = 1200;

export default function App() {
  const [deal, setDeal] = useState<Deal>(() => dealHand());
  const [dealId, setDealId] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>(() => loadAttempts());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const nextRef = useRef<HTMLButtonElement>(null);

  const range = ranges.RFI[deal.position];
  const freqs = range[deal.hand];
  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const openPct = useMemo(() => raisePct(range), [range]);

  useEffect(() => saveAttempts(attempts), [attempts]);
  useEffect(() => saveSettings(settings), [settings]);

  // Synchronous guard: two inputs in the same tick (key + click) must not log two attempts.
  const answeredRef = useRef(false);

  const answer = useCallback(
    (action: Action) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const r = scoreAnswer(action, freqs);
      setResult(r);
      const attempt: Attempt = {
        hand: deal.hand,
        position: deal.position,
        category: categoryOf(deal.hand),
        action,
        verdict: r.verdict,
        ts: Date.now(),
      };
      setAttempts((prev) => [...prev, attempt].slice(-MAX_STORED));
    },
    [freqs, deal],
  );

  const next = useCallback(() => {
    answeredRef.current = false;
    setDeal(dealHand());
    setDealId((i) => i + 1);
    setResult(null);
  }, []);

  const reset = useCallback(() => setAttempts([]), []);

  // Move focus to "Next hand" once answered, so Space/Enter continue the loop natively.
  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true });
  }, [result]);

  // Keyboard loop: F = fold, R = raise, Space/Enter = next hand.
  const keyState = useRef({ answer, next, answered: false });
  useLayoutEffect(() => {
    keyState.current = { answer, next, answered: result !== null };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      const k = e.key.toLowerCase();
      const s = keyState.current;
      if ((k === 'f' || k === 'r') && !s.answered) {
        e.preventDefault();
        s.answer(k === 'f' ? 'fold' : 'raise');
      } else if ((k === ' ' || k === 'enter') && s.answered) {
        if (t?.tagName === 'BUTTON') return; // native button activation handles it
        e.preventDefault();
        s.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Optional auto-advance after a perfect answer.
  useEffect(() => {
    if (!settings.autoAdvance || result?.verdict !== 'perfect') return;
    const id = window.setTimeout(next, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [settings.autoAdvance, result, next]);

  const revealed = result !== null || settings.revealBeforeAnswer;

  return (
    <div className="app">
      <Header source={ranges.meta.source} />

      <main className="layout">
        <section className="panel drill" aria-label="Drill">
          <PositionStrip position={deal.position} />
          <HandDisplay deal={deal} dealId={dealId} />
          <ActionBar onAnswer={answer} result={result} />
          <FeedbackCard
            result={result}
            explanation={result ? explain(deal.hand, deal.position, freqs, range) : ''}
            onNext={next}
            nextRef={nextRef}
            autoAdvance={settings.autoAdvance}
          />
          <SettingsBar settings={settings} onChange={setSettings} />
        </section>

        <aside className="side">
          <section className="panel" aria-label="Range chart">
            <div className="panel-head">
              <h2>
                Range · <span className="accent">{deal.position}</span>
              </h2>
              <span className="muted small">opens {openPct.toFixed(0)}% of hands</span>
            </div>
            <RangeGrid range={range} highlight={deal.hand} revealed={revealed} />
          </section>

          <StatsPanel stats={stats} onReset={reset} />
        </aside>
      </main>
    </div>
  );
}

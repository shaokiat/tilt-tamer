import { HowItWorks } from './Explainers';
import { Tip } from './Tip';

interface Props {
  source: string;
}

export function Header({ source }: Props) {
  const custom = source !== 'rule-generated';
  return (
    <header className="header">
      <div className="brand">
        <span className="logo" aria-hidden>
          ♠
        </span>
        <h1>
          Tilt Tamer <span className="h1-sub">preflop trainer</span>
        </h1>
        <span className="chip">RFI · 6-max · 100bb</span>
      </div>
      <div className="header-right">
        <span className="disclaimer" role="note" data-testid="disclaimer">
          <span aria-hidden>⚠</span> Simplified ranges, not solver output
        </span>
        <Tip content={<HowItWorks />} placement="bottom" align="end" wide className="how-tip" label="How the ranges are calculated">
          <span className="chip chip-action" data-testid="how-trigger">
            <span aria-hidden>ⓘ</span> How it works
          </span>
        </Tip>
        <span className={`chip source ${custom ? 'is-custom' : ''}`} data-testid="source" title="Where the active ranges come from">
          {custom ? 'custom' : 'rule-generated'}
        </span>
      </div>
    </header>
  );
}

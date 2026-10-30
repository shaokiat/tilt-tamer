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
        <h1>Preflop Trainer</h1>
        <span className="chip">RFI · 6-max · 100bb</span>
      </div>
      <div className="header-right">
        <span className={`chip source ${custom ? 'is-custom' : ''}`} data-testid="source" title="Where the active ranges come from">
          Source: {custom ? 'custom' : 'rule-generated'}
        </span>
      </div>
      <p className="disclaimer" role="note" data-testid="disclaimer">
        <span aria-hidden>⚠</span> Simplified ranges, not solver output
      </p>
    </header>
  );
}

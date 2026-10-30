import type { ScoreResult } from '../lib/scoring';
import type { Action } from '../lib/types';

interface Props {
  onAnswer: (a: Action) => void;
  result: ScoreResult | null;
}

const BUTTONS: { action: Action; label: string; key: string }[] = [
  { action: 'fold', label: 'Fold', key: 'F' },
  { action: 'raise', label: 'Raise', key: 'R' },
];

export function ActionBar({ onAnswer, result }: Props) {
  return (
    <div className="actions" role="group" aria-label="Your action">
      {BUTTONS.map(({ action, label, key }) => {
        const chosen = result?.action === action;
        return (
          <button
            key={action}
            type="button"
            className={`btn btn-${action} ${chosen ? `is-chosen is-${result!.verdict}` : ''}`}
            onClick={() => onAnswer(action)}
            disabled={result !== null}
            data-testid={`btn-${action}`}
          >
            {label}
            <kbd>{key}</kbd>
          </button>
        );
      })}
    </div>
  );
}

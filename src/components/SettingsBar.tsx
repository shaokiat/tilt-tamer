import type { Settings } from '../lib/storage';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

export function SettingsBar({ settings, onChange }: Props) {
  return (
    <div className="settings">
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.revealBeforeAnswer}
          onChange={(e) => onChange({ ...settings, revealBeforeAnswer: e.target.checked })}
        />
        <span className="toggle-ui" aria-hidden />
        Study mode (show range before answering)
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.autoAdvance}
          onChange={(e) => onChange({ ...settings, autoAdvance: e.target.checked })}
        />
        <span className="toggle-ui" aria-hidden />
        Auto-advance after perfect
      </label>
    </div>
  );
}

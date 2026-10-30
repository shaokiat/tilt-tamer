import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface Props {
  /** The trigger content (inline). */
  children: ReactNode;
  /** What to show on hover / focus / tap. */
  content: ReactNode;
  placement?: 'top' | 'bottom';
  align?: 'center' | 'start' | 'end';
  /** Wider panel with pointer events, for longer explanations the user may want to scroll or select. */
  wide?: boolean;
  className?: string;
  label?: string;
}

/**
 * Tooltip shown on hover and keyboard focus (pure CSS), and toggled on tap/click for touch screens.
 * The trigger is a focusable span (not a <button>) so Space/Enter keep driving the drill.
 */
export function Tip({ children, content, placement = 'top', align = 'center', wide = false, className = '', label }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className={`tip tip-${placement} tip-${align} ${wide ? 'tip-wide' : ''} ${open ? 'is-open' : ''} ${className}`}
    >
      <span
        className="tip-trigger"
        role="button"
        tabIndex={0}
        aria-describedby={id}
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </span>
      <span role="tooltip" id={id} className="tip-body">
        {content}
      </span>
    </span>
  );
}

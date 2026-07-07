'use client';

import { useId } from 'react';
import { cx } from './cx';

/**
 * v2 Switch — a labeled on/off control for settings (native semantics:
 * role="switch" + aria-checked on a real button). Frame register only:
 * the ON state is ink, never gold — flipping a preference is upkeep, not
 * a decision moment. Label and description sit beside the control and are
 * part of its accessible name/description; the whole row stays a ≥44px
 * target with the visible state also carried by knob position (color is
 * never the only signal).
 *
 * States: default / hover / focus-visible / active / disabled / busy
 * (aria-busy while a save is in flight; the control stays visible and
 * ignores input rather than dimming to nothing).
 */
export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** A save is in flight: announced, input ignored, no disabled dimming. */
  busy?: boolean;
  className?: string;
}

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  busy = false,
  className,
}: SwitchProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={cx('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="font-semibold text-ink">
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={busy || undefined}
        disabled={disabled}
        onClick={() => {
          if (!busy) onChange(!checked);
        }}
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full border outline-none',
          'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'disabled:cursor-not-allowed disabled:opacity-55',
          'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-snap',
          checked
            ? 'border-ink bg-ink'
            : 'border-line-strong bg-sunken hover:enabled:border-ink-muted'
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'absolute top-0.5 left-0.5 block size-5.5 rounded-full',
            'motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-snap',
            checked
              ? 'translate-x-5 bg-canvas'
              : 'translate-x-0 bg-surface shadow-sm'
          )}
        />
      </button>
    </div>
  );
}

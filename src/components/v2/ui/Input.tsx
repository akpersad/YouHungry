import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

/**
 * v2 Input — label always visible (never placeholder-as-label), required
 * marker shown, messages live beside the field and are announced via
 * aria-describedby. Error and success both pair color with an icon + text,
 * never color alone.
 *
 * States: default / hover (border darkens) / focus-visible (ring) /
 * disabled / error / success.
 */
export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'aria-invalid' | 'aria-describedby'
> & {
  label: string;
  help?: string;
  error?: string;
  success?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, help, error, success, required, disabled, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? success ?? help;

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cx(
          'h-11 rounded-lg border bg-surface px-3 text-base text-ink',
          'placeholder:text-ink-muted outline-none',
          'motion-safe:transition-colors motion-safe:duration-100',
          'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-canvas',
          'disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60',
          error
            ? 'border-danger'
            : 'border-line-strong hover:enabled:border-ink-muted focus-visible:border-line-strong'
        )}
        {...rest}
      />
      {message && (
        <p
          id={messageId}
          className={cx(
            'flex items-start gap-1 text-sm',
            error ? 'text-danger' : success ? 'text-ink' : 'text-ink-muted'
          )}
        >
          {(error || success) && (
            <svg
              className="mt-0.5 size-4 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              {error ? (
                <path
                  d="M8 1.5 15 14H1L8 1.5Zm0 4.5v4m0 2v.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M2.5 8.5 6 12l7.5-8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          )}
          {message}
        </p>
      )}
    </div>
  );
});

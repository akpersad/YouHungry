import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { cx } from './cx';

/**
 * v2 Button — the "taxi light" primary: gold fill, ink label. Gold is the
 * rationed decision accent (IDENTITY.md), so `primary` belongs to the one
 * decisive action on a screen; everything else is quiet or ghost.
 *
 * States: default / hover / focus-visible / active (press scale) / disabled /
 * loading (spinner + aria-busy, label stays for width stability). Error and
 * success are message-level concerns (Input, form feedback), not button skins.
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'quiet' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold ' +
  'outline-none select-none focus-visible:ring-2 focus-visible:ring-focus ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-55 ' +
  'motion-safe:transition-[transform,background-color,border-color] ' +
  'motion-safe:duration-100 motion-safe:ease-snap ' +
  'active:enabled:scale-97 touch-manipulation';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-gold text-gold-ink hover:enabled:bg-gold/85',
  quiet:
    'bg-surface text-ink border border-line-strong hover:enabled:bg-sunken',
  ghost: 'bg-transparent text-brass hover:enabled:bg-gold-tint',
  destructive:
    'bg-danger text-surface hover:enabled:bg-danger/85 dark:text-canvas',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-12 px-6 text-base',
};

// Anchors never match :enabled, so links carry their own hover/press rules.
const linkVariants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'hover:bg-gold/85',
  quiet: 'hover:bg-sunken',
  ghost: 'hover:bg-gold-tint',
  destructive: 'hover:bg-danger/85',
};

/** A navigation target dressed as a button — same variants, real <a>. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  href: string;
  variant?: NonNullable<ButtonProps['variant']>;
  size?: NonNullable<ButtonProps['size']>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        base,
        variants[variant],
        linkVariants[variant],
        sizes[size],
        'active:scale-97',
        className
      )}
    >
      {children}
    </Link>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cx(base, variants[variant], sizes[size], className)}
        {...rest}
      >
        {loading && (
          <svg
            className="size-4 shrink-0 animate-spin"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

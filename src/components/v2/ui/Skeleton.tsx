import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

/**
 * v2 Skeleton — decorative blocks (aria-hidden) that mirror the layout they
 * stand in for; the *group* announces loading exactly once. Pulse is
 * opacity-only (no paint-heavy shimmer), collapsed under reduced motion.
 */
export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'rounded-lg bg-sunken motion-safe:animate-pulse',
        className
      )}
      {...rest}
    />
  );
}

export function SkeletonGroup({
  label = 'Loading',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * v2 EmptyState — an invitation, not an apology (IDENTITY.md voice rules):
 * say what goes here and offer exactly one next action. Never "Nothing here."
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 px-6 py-12 text-center',
        className
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-gold-tint text-brass"
        >
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      {body && <p className="max-w-xs text-ink-secondary">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

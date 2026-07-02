import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  /** Optional icon or illustration above the headline (kept light per DESIGN.md). */
  icon?: ReactNode;
  /** Headline — rendered in the display serif (Fraunces). */
  title: string;
  description?: string;
  /** Primary call to action; pass either an action spec or custom node. */
  action?: EmptyStateAction | ReactNode;
  className?: string;
}

function isActionSpec(action: unknown): action is EmptyStateAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    'label' in action &&
    'onClick' in action
  );
}

/**
 * Designed empty state: copy-led, one warm CTA. Used wherever a surface has
 * nothing to show yet (zero collections, no search results, empty history).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12',
        className
      )}
    >
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--tomato-tint)', color: 'var(--tomato)' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="font-display text-2xl font-semibold text-ink text-balance">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-ink-secondary text-pretty">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {isActionSpec(action) ? (
            <Button onClick={action.onClick}>{action.label}</Button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}

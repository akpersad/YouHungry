'use client';

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from './cx';

/**
 * v2 Tabs — proper tablist semantics with roving tabindex and automatic
 * activation (Left/Right/Home/End). Selection change is a crisp swap —
 * decisive snap, no sliding indicator theater.
 */
export type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  className,
}: {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex((t) => t.id === active);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft')
      next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(tabs[next].id);
    listRef.current
      ?.querySelector<HTMLButtonElement>(
        `#${CSS.escape(`${baseId}-tab-${tabs[next].id}`)}`
      )
      ?.focus();
  };

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-line"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              className={cx(
                '-mb-px h-11 rounded-t-lg border-b-2 px-4 font-semibold outline-none',
                'motion-safe:transition-colors motion-safe:duration-100 touch-manipulation',
                'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset',
                selected
                  ? 'border-brass text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-4 outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

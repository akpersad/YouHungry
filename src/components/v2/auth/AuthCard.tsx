import type { ReactNode } from 'react';

/** Shared frame for the sign-in / sign-up screens: one calm card, centered. */
export function AuthCard({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="type-board text-2xl text-ink">{title}</h1>
          <p className="text-sm text-ink-secondary">{lede}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

import Link from 'next/link';

// Phase 2 — identity landed, journeys haven't. The real Fork lane home
// arrives in Phase 3; until then /beta points at the gallery.
export default function BetaHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="type-board text-sm text-ink-muted">Fork In The Road</p>
      <h1 className="text-3xl font-semibold">v2 beta</h1>
      <p className="text-ink-secondary">
        The identity is in. The Fork lane lands in Phase 3.
      </p>
      <Link
        href="/beta/gallery"
        className="rounded-lg px-4 py-2 font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
      >
        Browse the design gallery
      </Link>
    </main>
  );
}

// Phase 1 scaffold — proves the (v2) tree builds and serves independently of
// v1. The real Fork lane home arrives in Phase 3.
export default function BetaHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm uppercase tracking-widest text-v2-ink-muted">
        Fork In The Road
      </p>
      <h1 className="text-3xl font-semibold">v2 beta</h1>
      <p className="text-v2-ink-muted">
        Foundations only. The Fork lane lands in Phase 3.
      </p>
    </main>
  );
}

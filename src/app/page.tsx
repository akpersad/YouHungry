import { ButtonLink } from '@/components/v2/ui';
import { QuickSpin } from '@/components/v2/fork/QuickSpin';
import { OpenForks } from '@/components/v2/fork/OpenForks';

/**
 * The Fork lane home. One decisive block: tonight's question, the vibe
 * chips, and the spin — near-me value in two taps before any account
 * exists. Signed-in users also see their live forks and the group path.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <section aria-label="Tonight" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="type-board text-sm text-ink-muted">Tonight</p>
          <h1 className="type-board text-4xl text-ink sm:text-5xl">
            Where are we eating?
          </h1>
          <p className="max-w-lg text-ink-secondary">
            Spin what&apos;s near you and let the board call it. Recent picks
            count against themselves, so it never rules the same place twice in
            a row.
          </p>
        </div>
        <QuickSpin />
      </section>

      <OpenForks />

      <section
        aria-label="Fork with friends"
        className="flex flex-col gap-3 border-t border-line pt-8"
      >
        <h2 className="text-xl font-semibold text-ink">
          Deciding with friends?
        </h2>
        <p className="max-w-lg text-sm text-ink-secondary">
          Start a fork: pick the spots, choose spin or vote, set a timer.
          Debates end themselves here.
        </p>
        <div>
          <ButtonLink href="/new" variant="quiet">
            Start a fork
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}

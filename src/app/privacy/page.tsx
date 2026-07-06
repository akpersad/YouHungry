import type { Metadata } from 'next';

// v2's honest privacy policy (Phase 8; the v1 page described SMS and
// phone-number practices that died with v1). Static prose, frame register.

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy | Fork In The Road',
  description:
    'What Fork In The Road collects, what it never does, and how to get your data removed.',
};

const UPDATED = 'July 5, 2026';

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="type-board text-3xl text-ink sm:text-4xl">Privacy</h1>
          <p className="text-sm text-ink-muted">Last updated {UPDATED}</p>
          <p className="max-w-lg text-ink-secondary">
            Fork In The Road helps groups decide where to eat. It collects the
            minimum it needs to do that, and nothing it collects is ever sold or
            used for advertising.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            If you vote as a guest
          </h2>
          <p className="text-ink-secondary">
            Guests vote from a fork link with no account. We store the display
            name you type, your rankings, and timestamps. That is the whole
            list: no email, no phone, no location, no tracking profile. A signed
            cookie remembers your device so you can change your vote before the
            fork closes. If you later create an account you can claim those
            votes; until then they belong to a name and nothing else.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            If you have an account
          </h2>
          <p className="text-ink-secondary">
            Accounts are handled by Clerk, our sign-in provider. We keep your
            email, your username, and a display name. Passwords never touch our
            servers: Clerk stores them hashed. On top of that we store what the
            product is for: your saved places and lists, your crews, your forks,
            and your decision history. History is what powers the weighted
            wheel, so past picks count against themselves.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Location</h2>
          <p className="text-ink-secondary">
            When you spin near me, your browser asks you before sharing your
            location, and we use it once to find restaurants around you. Search
            areas are cached by approximate neighborhood so we call Google less,
            and that cache is not tied to you. We never store your precise
            location on your profile and we never track where you are.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Notifications</h2>
          <p className="text-ink-secondary">
            If you allow push notifications we store the subscription your
            browser gives us, and we use it for one thing: telling you where the
            group is going when a fork closes. The same result may reach your
            email. Both stop the moment you revoke permission or opt out.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            Cookies and local storage
          </h2>
          <p className="text-ink-secondary">
            We use Clerk&apos;s session cookies to keep you signed in and one
            signed cookie to recognize guest voters. Your theme choice and
            whether you dismissed the install prompt live in your browser and
            never leave it. There are no advertising or cross-site tracking
            cookies. Traffic analytics come from Vercel Analytics, which is
            cookieless and anonymous.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Who else sees data</h2>
          <p className="text-ink-secondary">
            Five services run the product: Clerk (sign-in), MongoDB Atlas (the
            database), Google Places (restaurant search), Resend (result
            emails), and Vercel (hosting and anonymous analytics). Each gets
            only what its job requires. Nobody gets data for advertising, and
            nothing is sold, rented, or shared beyond that list.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Retention</h2>
          <p className="text-ink-secondary">
            Decision history sticks around because the product runs on it.
            Housekeeping data does not: server error records and search-cache
            markers delete themselves within 30 days, and rate-limit counters
            (which briefly hold IP addresses) expire within minutes.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Removing your data</h2>
          <p className="text-ink-secondary">
            Ask, and it goes. Open an issue on{' '}
            <a
              className="text-brass underline underline-offset-2 hover:text-ink"
              href="https://github.com/akpersad/YouHungry/issues"
            >
              the project&apos;s GitHub repository
            </a>{' '}
            or contact the maintainer there, and your account and its data will
            be deleted. Guest votes carry no identity, so there is nothing to
            trace back to you once a fork closes.
          </p>
        </section>
      </article>
    </main>
  );
}

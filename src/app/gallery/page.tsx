'use client';

import { useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Input,
  Reveal,
  Sheet,
  Skeleton,
  SkeletonGroup,
  Switch,
  Tabs,
} from '@/components/v2/ui';

/**
 * /gallery — the Phase 2 identity gate. Every primitive, every state,
 * the palette, the type system, the voice rules, and the reveal — browsable
 * on a phone and a desktop, in both modes. This page IS the checkpoint:
 * promptFiles/v2/IDENTITY.md decides what's here; the design manual decides
 * how well.
 */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="type-board text-xl text-ink">{title}</h2>
        {note && <p className="mt-1 text-sm text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function SwitchDemo() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  return (
    <div className="flex max-w-md flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <Switch
        label="Push results"
        description="Sent to every device you turn on."
        checked={push}
        onChange={setPush}
      />
      <Switch
        label="Email results"
        description="One email per closed fork, nothing else."
        checked={email}
        onChange={setEmail}
      />
      <Switch
        label="Disabled"
        description="Legible, inert, no tooltip games."
        checked
        disabled
        onChange={() => {}}
      />
    </div>
  );
}

function Swatch({
  name,
  value,
  className,
  border,
}: {
  name: string;
  value: string;
  className: string;
  border?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className={
          'size-10 shrink-0 rounded-lg ' +
          className +
          (border ? ' border border-line' : '')
        }
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{name}</p>
        <p className="truncate font-mono text-xs text-ink-muted">{value}</p>
      </div>
    </div>
  );
}

const REVEAL_CANDIDATES = [
  'Blue Ribbon',
  'Taqueria Norte',
  'Lucali',
  'Golden Duck',
  'Via Carota',
];

export default function GalleryPage() {
  const [spin, setSpin] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-14 px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-4">
        {/* The color-mode toggle lives in the shared shell header. */}
        <p className="type-board text-sm text-ink-muted">
          Fork In The Road · v2 identity
        </p>
        <h1 className="type-board text-4xl text-ink sm:text-5xl">
          Tonight&apos;s board
        </h1>
        <p className="max-w-lg text-ink-secondary">
          A calm paper-and-ink frame, one rationed gold accent, and a board that
          lights up when the decision lands. Everything below is the real
          component set. Press it, tab through it, flip the mode.
        </p>
      </header>

      {/* The hero gets designed first: the reveal. */}
      <Section
        title="The reveal"
        note="The signature moment: decelerating flaps, then gold. Tap the board to skip; reduced motion goes straight to the result."
      >
        <Reveal
          key={spin}
          candidates={REVEAL_CANDIDATES}
          winner="Golden Duck"
          context={
            <span>Weighted spin. You haven&apos;t been in 3 weeks.</span>
          }
        />
        <div>
          <Button variant="quiet" onClick={() => setSpin((s) => s + 1)}>
            Spin again
          </Button>
        </div>
      </Section>

      <Section
        title="Palette"
        note="Bottle green frame, gold only at decision points. Every pair WCAG-verified before it became a token."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Swatch
            name="canvas"
            value="oklch(0.985 0.006 120)"
            className="bg-canvas"
            border
          />
          <Swatch
            name="surface"
            value="oklch(1 0 0)"
            className="bg-surface"
            border
          />
          <Swatch
            name="sunken"
            value="oklch(0.955 0.01 120)"
            className="bg-sunken"
            border
          />
          <Swatch name="ink" value="oklch(0.26 0.04 155)" className="bg-ink" />
          <Swatch
            name="ink-secondary"
            value="oklch(0.42 0.03 155)"
            className="bg-ink-secondary"
          />
          <Swatch
            name="ink-muted"
            value="oklch(0.5 0.025 155)"
            className="bg-ink-muted"
          />
          <Swatch
            name="gold: the decision accent"
            value="oklch(0.8 0.16 85)"
            className="bg-gold"
          />
          <Swatch
            name="brass: gold's text-safe shade"
            value="oklch(0.52 0.11 75)"
            className="bg-brass"
          />
          <Swatch
            name="danger: destructive only"
            value="oklch(0.5 0.19 25)"
            className="bg-danger"
          />
          <Swatch
            name="board: mode-invariant"
            value="oklch(0.21 0.03 155)"
            className="bg-board"
          />
        </div>
      </Section>

      <Section
        title="Type"
        note="One family, many voices: Archivo's width axis carries the board register. Spline Sans Mono carries data: codes, countdowns, tallies."
      >
        <Card variant="outline" className="flex flex-col gap-4">
          <p className="type-board text-3xl">Golden Duck</p>
          <p className="text-xl font-semibold">
            Ranked. Three points to first choice.
          </p>
          <p className="max-w-md">
            Body text is Archivo at 16 over 1.5. The frame stays quiet so the
            board can be loud. Emphasis is <strong>600</strong>, never a thinner
            weight.
          </p>
          <p className="font-mono text-sm text-ink-secondary tnum">
            fork F-7KQ2 · closes in 12:40 · 5 of 8 voted
          </p>
        </Card>
      </Section>

      <Section
        title="Buttons"
        note="Gold belongs to the one decisive action on a screen. Press any of them: 97% scale, 100ms, no bounce."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Fork it</Button>
          <Button variant="quiet">Keep this one</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive">Delete list</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button loading>Locking it in</Button>
          <Button disabled>Fork it</Button>
          <Button size="sm" variant="quiet">
            Small
          </Button>
          <Button size="lg">Start a fork</Button>
        </div>
      </Section>

      <Section
        title="Inputs"
        note="Labels always visible, messages beside the field, error and success carry an icon, never color alone."
      >
        <div className="grid max-w-md grid-cols-1 gap-5">
          <Input label="Display name" placeholder="How the crew sees you" />
          <Input
            label="Email"
            type="email"
            required
            help="For your fork results, nothing else."
          />
          <Input
            label="Email"
            type="email"
            defaultValue="andrew@"
            error="Email needs a domain. Try name@example.com"
          />
          <Input label="Fork code" defaultValue="F-7KQ2" success="Fork found" />
          <Input label="Phone" disabled placeholder="v2 never asks for this" />
        </div>
      </Section>

      <Section
        title="Cards"
        note="One elevation story each: lift or hairline, never both."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <p className="font-semibold">Raised</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Tinted layered shadow in light; lighter surface in dark.
            </p>
          </Card>
          <Card variant="outline">
            <p className="font-semibold">Outline</p>
            <p className="mt-1 text-sm text-ink-secondary">
              A hairline for content at rest on the same plane.
            </p>
          </Card>
          <Card
            interactive
            tabIndex={0}
            role="button"
            className="sm:col-span-2"
          >
            <p className="font-semibold">Interactive</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Whole-card target: hover sinks, press scales, focus rings.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Switch"
        note="Settings only. ON is ink, never gold: a preference is upkeep, not a decision."
      >
        <SwitchDemo />
      </Section>

      <Section title="Tabs" note="Crisp swap, no sliding indicator theater.">
        <Tabs
          tabs={[
            {
              id: 'spin',
              label: 'Spin',
              content: (
                <p className="text-ink-secondary">
                  Instant weighted-random. Fate, with a 30-day memory.
                </p>
              ),
            },
            {
              id: 'vote',
              label: 'Vote',
              content: (
                <p className="text-ink-secondary">
                  Ranked choice, 3/2/1. Closes on quorum or the timer.
                </p>
              ),
            },
            {
              id: 'history',
              label: 'History',
              content: (
                <p className="text-ink-secondary">
                  Past forks and where they landed.
                </p>
              ),
            },
          ]}
        />
      </Section>

      <Section
        title="Loading"
        note="Skeletons mirror the layout they stand in for; the group announces once."
      >
        <SkeletonGroup label="Loading places">
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonGroup>
      </Section>

      <Section
        title="Empty state"
        note="An invitation, not an apology: say what goes here and offer one action."
      >
        <Card variant="outline">
          <EmptyState
            icon={
              <svg
                viewBox="0 0 20 20"
                className="size-5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 2v6m0 0c0 2-1.5 3-3 3m3-3c0 2 1.5 3 3 3M7 18l3-7 3 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title="No lists yet"
            body="Save a place and start one. Lists make forks faster."
            action={<Button variant="quiet">Find places</Button>}
          />
        </Card>
      </Section>

      <Section
        title="Dialog & sheet"
        note="Native <dialog> underneath: focus trap, Esc, and focus return come from the platform."
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="quiet" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant="quiet" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </div>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Delete this list?"
        >
          <p className="text-ink-secondary">
            Sushi Tour and its 12 places go away for good.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={() => setDialogOpen(false)}>
              Delete list
            </Button>
          </div>
        </Dialog>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Pick a vibe"
        >
          <div className="flex flex-col gap-2 pb-2">
            {['Anything', 'Cheap eats', 'Date night', 'Fast'].map((vibe) => (
              <button
                key={vibe}
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-12 rounded-lg px-4 text-left font-semibold text-ink outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus"
              >
                {vibe}
              </button>
            ))}
          </div>
        </Sheet>
      </Section>

      <Section
        title="Voice"
        note="The friend who ends the debate. Verbs own the buttons; time is concrete; sentence case everywhere."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card variant="outline">
            <p className="type-board text-sm text-ink-muted">Say</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-ink">
              <li>Fork it</li>
              <li>We&apos;re going here.</li>
              <li>Closes in 12:40</li>
              <li>No lists yet. Save a place and start one.</li>
            </ul>
          </Card>
          <Card variant="outline">
            <p className="type-board text-sm text-ink-muted">Never</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-ink-muted">
              <li className="line-through">Submit</li>
              <li className="line-through">Congratulations!! 🎉</li>
              <li className="line-through">Expiring soon</li>
              <li className="line-through">Nothing here</li>
            </ul>
          </Card>
        </div>
      </Section>

      <footer className="border-t border-line pt-6 text-sm text-ink-muted">
        <p>
          Phase 2 gate. Direction and craft rules in{' '}
          <span className="font-mono">promptFiles/v2/IDENTITY.md</span>. The
          Fork lane builds on this in Phase 3.
        </p>
      </footer>
    </main>
  );
}

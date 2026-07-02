'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Button, ButtonLink, EmptyState, Reveal } from '@/components/v2/ui';
import { cx } from '@/components/v2/ui/cx';
import type { PlaceSummary } from '@/lib/v2/http';

/**
 * The cold-open journey (CHARTER success criterion 1): tap "Spin near me",
 * allow location, watch the board decide — two taps, no account. Nothing
 * persists unless a signed-in user locks the result in, so "Spin again"
 * costs nothing and history stays honest.
 */

const VIBE_CHIPS = [
  { key: undefined, label: 'Anything' },
  { key: 'cheap', label: 'Cheap eats' },
  { key: 'fancy', label: 'Make it fancy' },
  { key: 'top', label: 'Top rated' },
] as const;

type Stage =
  | 'idle'
  | 'locating'
  | 'fetching'
  | 'revealing'
  | 'revealed'
  | 'locked';

interface SpinData {
  coords: { lat: number; lng: number };
  places: PlaceSummary[];
  winnerPlaceId: string;
  weights: Record<string, number>;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10_000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

/** "Why this pick" in humane terms — the numbers stay in the API. */
function whyThisPick(data: SpinData): string {
  const penalized = Object.values(data.weights).filter((w) => w < 1).length;
  const count = data.places.length;
  if (count === 1) return 'The only spot in range. Fate had it easy.';
  if (penalized === 0) return `All ${count} nearby spots had an equal shot.`;
  return `${count} spots in the running. Recent picks got a smaller slice.`;
}

export function QuickSpin() {
  const { isSignedIn } = useUser();
  const [stage, setStage] = useState<Stage>('idle');
  const [vibe, setVibe] = useState<string | undefined>(undefined);
  const [data, setData] = useState<SpinData | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [locking, setLocking] = useState(false);

  const spin = async (coords?: { lat: number; lng: number }) => {
    setError(null);
    setEmpty(false);
    try {
      let at = coords;
      if (!at) {
        setStage('locating');
        try {
          const position = await getPosition();
          at = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (err) {
          setStage(data ? 'revealed' : 'idle');
          // Duck-typed PERMISSION_DENIED (code 1) — the
          // GeolocationPositionError constructor is not universal.
          const denied =
            typeof err === 'object' &&
            err !== null &&
            (err as { code?: number }).code === 1;
          setError(
            denied
              ? 'Location is blocked. Allow it in your browser, or start a fork and pick spots yourself.'
              : 'No location fix. Try again in a moment.'
          );
          return;
        }
      }

      setStage('fetching');
      const response = await fetch('/api/v2/quick-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: at.lat, lng: at.lng, vibe }),
      });
      if (!response.ok) throw new Error('spin failed');
      const payload: {
        places: PlaceSummary[];
        spin: {
          winnerPlaceId: string;
          weights: Record<string, number>;
        } | null;
      } = await response.json();

      if (!payload.spin || payload.places.length === 0) {
        setStage('idle');
        setData(null);
        setEmpty(true);
        return;
      }

      setData({
        coords: at,
        places: payload.places,
        winnerPlaceId: payload.spin.winnerPlaceId,
        weights: payload.spin.weights,
      });
      setSpinCount((count) => count + 1);
      setStage('revealing');
    } catch {
      setStage(data ? 'revealed' : 'idle');
      setError('The spin did not go through. Try again.');
    }
  };

  const lockIn = async () => {
    if (!data || locking) return;
    setLocking(true);
    setError(null);
    try {
      const response = await fetch('/api/v2/quick-spin/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: data.coords.lat,
          lng: data.coords.lng,
          vibe,
          optionPlaceIds: data.places.map((place) => place.id),
          winnerPlaceId: data.winnerPlaceId,
        }),
      });
      if (!response.ok) throw new Error('lock failed');
      setStage('locked');
    } catch {
      setError('Could not save that. Try locking it in again.');
    } finally {
      setLocking(false);
    }
  };

  const winner = data?.places.find((place) => place.id === data.winnerPlaceId);
  const busy = stage === 'locating' || stage === 'fetching';

  return (
    <section aria-label="Quick spin" className="flex flex-col gap-5">
      {/* Vibe filter — quiet chips; the gold stays on the decision. */}
      <div role="group" aria-label="Vibe" className="flex flex-wrap gap-2">
        {VIBE_CHIPS.map((chip) => {
          const selected = vibe === chip.key;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={selected}
              onClick={() => setVibe(chip.key)}
              className={cx(
                'h-9 rounded-full border px-4 text-sm font-semibold outline-none',
                'motion-safe:transition-colors motion-safe:duration-100',
                'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                selected
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-line-strong bg-surface text-ink-secondary hover:bg-sunken'
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {data && stage !== 'idle' ? (
        <div className="flex flex-col gap-4">
          <Reveal
            key={spinCount}
            candidates={data.places.map((place) => place.name)}
            winner={winner?.name ?? 'Somewhere good'}
            context={whyThisPick(data)}
            onDone={() =>
              setStage((current) =>
                current === 'revealing' ? 'revealed' : current
              )
            }
          />

          {(stage === 'revealed' || stage === 'locked') && winner && (
            <div className="flex flex-col gap-4">
              <div className="text-sm text-ink-secondary">
                <p className="font-semibold text-ink">{winner.name}</p>
                <p>{winner.address}</p>
                {(winner.rating || winner.priceLevel) && (
                  <p className="tnum mt-0.5 text-ink-muted">
                    {[
                      winner.rating ? `${winner.rating.toFixed(1)} ★` : null,
                      winner.priceLevel ? '$'.repeat(winner.priceLevel) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {stage === 'locked' ? (
                  <p role="status" className="text-sm font-semibold text-ink">
                    Locked in. This one counts toward your history.
                  </p>
                ) : isSignedIn ? (
                  <Button onClick={lockIn} loading={locking}>
                    Lock it in
                  </Button>
                ) : null}
                <Button
                  variant="quiet"
                  onClick={() => spin(data.coords)}
                  loading={busy}
                >
                  Spin again
                </Button>
              </div>

              {!isSignedIn && (
                <p className="text-sm text-ink-muted">
                  <Link
                    href="/beta/sign-up"
                    className="rounded font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    Create an account
                  </Link>{' '}
                  and locked-in picks build history, so repeats get rarer.
                </p>
              )}
            </div>
          )}
        </div>
      ) : empty ? (
        <EmptyState
          title="No spots near you yet"
          body="The place cache is still filling in around here. Start a fork and add spots yourself."
          action={
            <ButtonLink href="/beta/new" variant="quiet">
              Start a fork
            </ButtonLink>
          }
        />
      ) : (
        <Button size="lg" onClick={() => spin()} loading={busy}>
          {stage === 'locating' ? 'Finding you' : 'Spin near me'}
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

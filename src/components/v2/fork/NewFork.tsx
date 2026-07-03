'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Input,
  Skeleton,
  SkeletonGroup,
  Tabs,
} from '@/components/v2/ui';
import { cx } from '@/components/v2/ui/cx';
import type { PlaceSummary } from '@/lib/v2/http';

/**
 * Fork creation: spots → mode → timer → "Fork it". One page, three
 * decisions, no ceremony. Spots come from near me, one of my lists, or
 * search — mixing sources is fine (the fork is honest about it: a mixed
 * ballot is recorded as ad-hoc).
 */

type Origin = 'near-me' | 'search' | `list:${string}`;

interface SelectedPlace {
  place: PlaceSummary;
  origin: Origin;
}

interface ListSummary {
  id: string;
  name: string;
  placeCount: number;
}

const LIFESPANS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
] as const;

function deriveSource(
  selections: SelectedPlace[],
  coords: { lat: number; lng: number } | null
) {
  const origins = new Set(selections.map((s) => s.origin));
  if (origins.size === 1) {
    const [origin] = origins;
    if (origin === 'near-me' && coords) {
      return { kind: 'near-me' as const, lat: coords.lat, lng: coords.lng };
    }
    if (origin.startsWith('list:')) {
      return { kind: 'list' as const, listId: origin.slice(5) };
    }
  }
  return { kind: 'ad-hoc' as const };
}

/** A place row with an add/remove toggle, used by every source tab. */
function PlaceRow({
  place,
  added,
  onToggle,
}: {
  place: PlaceSummary;
  added: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{place.name}</p>
        <p className="truncate text-sm text-ink-muted">
          {[
            place.rating ? `${place.rating.toFixed(1)} ★` : null,
            place.priceLevel ? '$'.repeat(place.priceLevel) : null,
            place.address,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <Button
        variant={added ? 'ghost' : 'quiet'}
        size="sm"
        onClick={onToggle}
        aria-pressed={added}
        aria-label={`${added ? 'Remove' : 'Add'} ${place.name}`}
      >
        {added ? 'Added' : 'Add'}
      </Button>
    </li>
  );
}

export function NewFork({ initialListId }: { initialListId?: string }) {
  const router = useRouter();

  // Ballot
  const [selections, setSelections] = useState<SelectedPlace[]>([]);
  // Near me
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [nearby, setNearby] = useState<PlaceSummary[] | null>(null);
  const [nearbyBusy, setNearbyBusy] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  // Lists
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [listPlaces, setListPlaces] = useState<
    Record<string, PlaceSummary[] | undefined>
  >({});
  const [activeListId, setActiveListId] = useState<string | null>(null);
  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSummary[] | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  // Mode & timer
  const [mode, setMode] = useState<'spin' | 'vote'>('spin');
  const [quorum, setQuorum] = useState('');
  const [lifespan, setLifespan] = useState(30);
  // Submit
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listsLoaded = useRef(false);

  // "Fork this list" (Places lane): arrive with the list open and its
  // places already on the ballot — the ballot fills itself.
  useEffect(() => {
    if (!initialListId) return;
    listsLoaded.current = true;
    void (async () => {
      try {
        const [listsResponse, listResponse] = await Promise.all([
          fetch('/api/v2/lists'),
          fetch(`/api/v2/lists/${initialListId}`),
        ]);
        if (listsResponse.ok) {
          const payload: { lists: ListSummary[] } = await listsResponse.json();
          setLists(payload.lists);
        } else {
          setLists([]);
        }
        if (!listResponse.ok) return;
        const payload: { list: { places: PlaceSummary[] } } =
          await listResponse.json();
        setListPlaces((current) => ({
          ...current,
          [initialListId]: payload.list.places,
        }));
        setActiveListId(initialListId);
        setSelections((current) =>
          current.length > 0
            ? current
            : payload.list.places.slice(0, 24).map((place) => ({
                place,
                origin: `list:${initialListId}` as Origin,
              }))
        );
      } catch {
        // The lists tab still works by hand; nothing to announce.
      }
    })();
  }, [initialListId]);

  const isSelected = (id: string) =>
    selections.some((selection) => selection.place.id === id);

  const toggle = (place: PlaceSummary, origin: Origin) => {
    setSelections((current) =>
      current.some((selection) => selection.place.id === place.id)
        ? current.filter((selection) => selection.place.id !== place.id)
        : [...current, { place, origin }]
    );
  };

  const remove = (placeId: string) => {
    setSelections((current) =>
      current.filter((selection) => selection.place.id !== placeId)
    );
  };

  const loadNearby = () => {
    setNearbyBusy(true);
    setNearbyError(null);
    navigator.geolocation?.getCurrentPosition(
      async (position) => {
        const at = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(at);
        try {
          const response = await fetch(
            `/api/v2/places/nearby?lat=${at.lat}&lng=${at.lng}`
          );
          if (!response.ok) throw new Error('nearby failed');
          const payload: { places: PlaceSummary[] } = await response.json();
          setNearby(payload.places);
        } catch {
          setNearbyError('Could not load nearby spots. Try again.');
        } finally {
          setNearbyBusy(false);
        }
      },
      () => {
        setNearbyBusy(false);
        setNearbyError('Location is blocked. Use a list or search instead.');
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const loadLists = () => {
    if (listsLoaded.current) return;
    listsLoaded.current = true;
    fetch('/api/v2/lists')
      .then((response) => response.json())
      .then((payload: { lists: ListSummary[] }) => setLists(payload.lists))
      .catch(() => setLists([]));
  };

  const openList = async (listId: string) => {
    setActiveListId(listId);
    if (listPlaces[listId]) return;
    try {
      const response = await fetch(`/api/v2/lists/${listId}`);
      if (!response.ok) throw new Error('list failed');
      const payload: { list: { places: PlaceSummary[] } } =
        await response.json();
      setListPlaces((current) => ({
        ...current,
        [listId]: payload.list.places,
      }));
    } catch {
      setListPlaces((current) => ({ ...current, [listId]: [] }));
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim() || searchBusy) return;
    setSearchBusy(true);
    try {
      const response = await fetch(
        `/api/v2/places/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!response.ok) throw new Error('search failed');
      const payload: { places: PlaceSummary[] } = await response.json();
      setResults(payload.places);
    } catch {
      setResults([]);
    } finally {
      setSearchBusy(false);
    }
  };

  const create = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const parsedQuorum = Number.parseInt(quorum, 10);
      const response = await fetch('/api/v2/forks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          source: deriveSource(selections, coords),
          optionPlaceIds: selections.map((selection) => selection.place.id),
          lifespanMinutes: lifespan,
          ...(mode === 'vote' && Number.isFinite(parsedQuorum) && quorum !== ''
            ? { quorum: parsedQuorum }
            : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'create failed');
      }
      router.push(`/beta/f/${payload.fork.code}`);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'create failed'
          ? err.message
          : 'Could not create the fork. Try again.'
      );
      setCreating(false);
    }
  };

  const chipClass = (selected: boolean) =>
    cx(
      'h-9 rounded-full border px-4 text-sm font-semibold outline-none',
      'motion-safe:transition-colors motion-safe:duration-100',
      'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
      selected
        ? 'border-ink bg-ink text-canvas'
        : 'border-line-strong bg-surface text-ink-secondary hover:bg-sunken'
    );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">New fork</p>
        <h1 className="type-board text-3xl text-ink sm:text-4xl">
          What&apos;s in the running?
        </h1>
        <p className="max-w-lg text-sm text-ink-secondary">
          Pick at least two spots, choose how it gets decided, set the timer.
        </p>
      </div>

      {/* Spots */}
      <section aria-label="Spots" className="flex flex-col gap-4">
        <Tabs
          defaultTab={initialListId ? 'lists' : undefined}
          tabs={[
            {
              id: 'near-me',
              label: 'Near me',
              content: (
                <div className="flex flex-col gap-3">
                  {nearby === null && !nearbyBusy && (
                    <div>
                      <Button variant="quiet" onClick={loadNearby}>
                        Use my location
                      </Button>
                    </div>
                  )}
                  {nearbyBusy && (
                    <SkeletonGroup label="Finding spots near you">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </SkeletonGroup>
                  )}
                  {nearbyError && (
                    <p role="alert" className="text-sm text-danger">
                      {nearbyError}
                    </p>
                  )}
                  {nearby && nearby.length === 0 && (
                    <p className="text-sm text-ink-secondary">
                      No spots in the cache near you yet. Search or use a list
                      instead.
                    </p>
                  )}
                  {nearby && nearby.length > 0 && (
                    <ul className="divide-y divide-line">
                      {nearby.map((place) => (
                        <PlaceRow
                          key={place.id}
                          place={place}
                          added={isSelected(place.id)}
                          onToggle={() => toggle(place, 'near-me')}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              ),
            },
            {
              id: 'lists',
              label: 'My lists',
              content: (
                <div className="flex flex-col gap-3">
                  {lists === null ? (
                    <SkeletonGroup label="Loading your lists">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </SkeletonGroup>
                  ) : lists.length === 0 ? (
                    <p className="text-sm text-ink-secondary">
                      No lists yet. Save spots in{' '}
                      <Link
                        href="/beta/places"
                        className="rounded font-semibold text-brass underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Places
                      </Link>{' '}
                      and they show up here.
                    </p>
                  ) : (
                    <>
                      <div
                        role="group"
                        aria-label="Choose a list"
                        className="flex flex-wrap gap-2"
                      >
                        {lists.map((list) => (
                          <button
                            key={list.id}
                            type="button"
                            aria-pressed={activeListId === list.id}
                            onClick={() => openList(list.id)}
                            className={chipClass(activeListId === list.id)}
                          >
                            {list.name} · {list.placeCount}
                          </button>
                        ))}
                      </div>
                      {activeListId && !listPlaces[activeListId] && (
                        <SkeletonGroup label="Loading list">
                          <Skeleton className="h-12 w-full" />
                        </SkeletonGroup>
                      )}
                      {activeListId && listPlaces[activeListId] && (
                        <ul className="divide-y divide-line">
                          {listPlaces[activeListId]!.map((place) => (
                            <PlaceRow
                              key={place.id}
                              place={place}
                              added={isSelected(place.id)}
                              onToggle={() =>
                                toggle(place, `list:${activeListId}`)
                              }
                            />
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              ),
            },
            {
              id: 'search',
              label: 'Search',
              content: (
                <div className="flex flex-col gap-3">
                  <form onSubmit={search} className="flex items-end gap-2">
                    <Input
                      label="Find a spot"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      variant="quiet"
                      loading={searchBusy}
                      className="shrink-0"
                    >
                      Search
                    </Button>
                  </form>
                  {results && results.length === 0 && (
                    <p className="text-sm text-ink-secondary">
                      Nothing by that name in the cache yet. Full search arrives
                      with Places.
                    </p>
                  )}
                  {results && results.length > 0 && (
                    <ul className="divide-y divide-line">
                      {results.map((place) => (
                        <PlaceRow
                          key={place.id}
                          place={place}
                          added={isSelected(place.id)}
                          onToggle={() => toggle(place, 'search')}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              ),
            },
          ]}
          onChange={(id) => {
            if (id === 'lists') loadLists();
          }}
        />

        {/* The ballot so far */}
        {selections.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-sunken p-4">
            <p className="text-sm font-semibold text-ink">
              On the ballot ({selections.length})
            </p>
            <ul className="flex flex-wrap gap-2">
              {selections.map(({ place }) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => remove(place.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 text-sm font-semibold text-ink outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {place.name}
                    <span aria-hidden="true" className="text-ink-muted">
                      ×
                    </span>
                    <span className="sr-only">(remove)</span>
                  </button>
                </li>
              ))}
            </ul>
            {selections.length < 2 && (
              <p className="text-sm text-ink-muted">
                Add at least one more. A fork needs two ways to go.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            title="Nothing on the ballot yet"
            body="Add spots from near you, a list, or search."
            className="py-8"
          />
        )}
      </section>

      {/* Mode */}
      <fieldset className="flex flex-col gap-3">
        <legend className="pb-3 text-xl font-semibold text-ink">
          How does it get decided?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: 'spin',
                title: 'Spin',
                body: 'Fate decides, weighted by history. Recent picks get a smaller slice.',
              },
              {
                value: 'vote',
                title: 'Vote',
                body: 'Everyone ranks their top 3. Points decide: 3, 2, 1.',
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={cx(
                'flex cursor-pointer flex-col gap-1 rounded-2xl border p-4',
                'motion-safe:transition-colors motion-safe:duration-100',
                'has-focus-visible:ring-2 has-focus-visible:ring-focus has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-canvas',
                mode === option.value
                  ? 'border-ink bg-surface'
                  : 'border-line bg-surface hover:bg-sunken'
              )}
            >
              <input
                type="radio"
                name="mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                className="sr-only"
              />
              <span className="font-semibold text-ink">{option.title}</span>
              <span className="text-sm text-ink-secondary">{option.body}</span>
            </label>
          ))}
        </div>
        {mode === 'vote' && (
          <Input
            label="Close early after this many votes"
            help="Optional. Leave it empty to let the timer run out."
            inputMode="numeric"
            value={quorum}
            onChange={(event) =>
              setQuorum(event.target.value.replace(/\D/g, ''))
            }
            className="max-w-xs"
          />
        )}
      </fieldset>

      {/* Timer */}
      <fieldset className="flex flex-col gap-3">
        <legend className="pb-3 text-xl font-semibold text-ink">
          How long does it stay open?
        </legend>
        <div role="group" aria-label="Timer" className="flex flex-wrap gap-2">
          {LIFESPANS.map((option) => (
            <button
              key={option.minutes}
              type="button"
              aria-pressed={lifespan === option.minutes}
              onClick={() => setLifespan(option.minutes)}
              className={chipClass(lifespan === option.minutes)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-muted">
          Forks end themselves. When the timer runs out, the decision lands.
        </p>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <Button
          size="lg"
          onClick={create}
          loading={creating}
          disabled={selections.length < 2}
        >
          Fork it
        </Button>
        {selections.length < 2 && (
          <p className="text-sm text-ink-muted">Two spots minimum.</p>
        )}
      </div>
    </main>
  );
}

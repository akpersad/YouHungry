'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  ButtonLink,
  EmptyState,
  Input,
  Skeleton,
  SkeletonGroup,
} from '@/components/v2/ui';
import { cx } from '@/components/v2/ui/cx';
import type { PlaceSummary } from '@/lib/v2/http';
import { PlaceMeta } from './PlaceMeta';
import { SaveToListDialog, type ListSummary } from './SaveToListDialog';

/**
 * The Places lane (CHARTER lane 2): search, save, organize into lists.
 * Lists are accelerants, never prerequisites — the copy and the flow both
 * lead back to forking. Quiet lane: gold stays on decision moments, and
 * nothing here is one.
 *
 * Two ways in (owner ask 2026-07-06 — search alone demanded you already
 * know the restaurant): type a name, or browse what's around the saved
 * home base / live location with price-and-rating chips. Both feed the
 * same save-to-list rows.
 */

const SEARCH_DEBOUNCE_MS = 300;

/** Where a browse is centered. */
export interface BrowseAnchor {
  label: string;
  lat: number;
  lng: number;
}

/** Mirrors lib/v2/places VIBES — keys are API contract, labels are ours. */
const BROWSE_VIBES = [
  { key: undefined, label: 'Everything' },
  { key: 'cheap', label: 'Cheap eats' },
  { key: 'fancy', label: 'Make it fancy' },
  { key: 'top', label: 'Top rated' },
] as const;

const BROWSE_RADII = [
  { m: 1500, label: 'Close by' },
  { m: 5000, label: 'Short drive' },
] as const;

/** QuickSpin's chip idiom: selected is ink-filled, never gold (frame work). */
function BrowseChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'h-9 rounded-full border px-4 text-sm font-semibold outline-none',
        'motion-safe:transition-colors motion-safe:duration-100',
        'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        selected
          ? 'border-ink bg-ink text-canvas'
          : 'border-line-strong bg-surface text-ink-secondary hover:bg-sunken'
      )}
    >
      {label}
    </button>
  );
}

function PlaceRows({
  places,
  ariaLabel,
  savedNotes,
  onSave,
}: {
  places: PlaceSummary[];
  ariaLabel: string;
  savedNotes: Record<string, string>;
  onSave: (place: PlaceSummary) => void;
}) {
  return (
    <ul className="flex flex-col divide-y divide-line" aria-label={ariaLabel}>
      {places.map((place) => (
        <li
          key={place.id}
          className="flex items-center justify-between gap-3 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{place.name}</p>
            <p className="truncate text-sm text-ink-secondary">
              {place.address}
            </p>
            <PlaceMeta place={place} />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Button variant="quiet" size="sm" onClick={() => onSave(place)}>
              Save
            </Button>
            {savedNotes[place.id] && (
              <p role="status" className="text-xs text-ink-muted">
                Kept on {savedNotes[place.id]}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListRow({ list }: { list: ListSummary }) {
  return (
    <Link
      href={`/places/l/${list.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus motion-safe:duration-100"
    >
      <span className="truncate font-semibold text-ink">{list.name}</span>
      <span className="tnum shrink-0 text-sm text-ink-muted">
        {list.placeCount === 1 ? '1 place' : `${list.placeCount} places`}
      </span>
    </Link>
  );
}

export function PlacesLane({
  initialLists,
  anchor,
}: {
  initialLists: ListSummary[];
  anchor: BrowseAnchor | null;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [browseCenter, setBrowseCenter] = useState<BrowseAnchor | null>(null);
  const [browseVibe, setBrowseVibe] = useState<string | undefined>(undefined);
  const [browseRadius, setBrowseRadius] = useState<number>(1500);
  const [browseResults, setBrowseResults] = useState<PlaceSummary[] | null>(
    null
  );
  const [browsing, setBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [lists, setLists] = useState<ListSummary[]>(initialLists);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [savingPlace, setSavingPlace] = useState<PlaceSummary | null>(null);
  /** placeId → list name, for "Kept on X" feedback at the row. */
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});

  // Typing drives the visible state (searching/cleared) synchronously in
  // the handler; the effect only owns the debounced fetch itself.
  const onQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      setSearching(false);
      setSearchError(null);
    } else {
      setSearching(true);
    }
  };

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v2/places/search?q=${encodeURIComponent(q)}`
        );
        if (!response.ok) throw new Error('search failed');
        const payload: { places: PlaceSummary[] } = await response.json();
        setResults(payload.places);
        setSearchError(null);
      } catch {
        setResults(null);
        setSearchError('Search is not answering. Try again in a moment.');
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const browse = async (
    center: BrowseAnchor,
    vibe: string | undefined,
    radiusM: number
  ) => {
    setBrowseCenter(center);
    setBrowseVibe(vibe);
    setBrowseRadius(radiusM);
    setBrowsing(true);
    setBrowseError(null);
    try {
      const params = new URLSearchParams({
        lat: String(center.lat),
        lng: String(center.lng),
        radiusM: String(radiusM),
      });
      if (vibe) params.set('vibe', vibe);
      const response = await fetch(`/api/v2/places/nearby?${params}`);
      if (!response.ok) throw new Error('browse failed');
      const payload: { places: PlaceSummary[] } = await response.json();
      setBrowseResults(payload.places);
    } catch {
      setBrowseResults(null);
      setBrowseError('Could not look around right now. Try again.');
    } finally {
      setBrowsing(false);
    }
  };

  const browseFromDevice = () => {
    if (locating) return;
    if (!('geolocation' in navigator)) {
      setBrowseError('This browser cannot share a location.');
      return;
    }
    setLocating(true);
    setBrowseError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void browse(
          {
            label: 'your location',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          browseVibe,
          browseRadius
        );
      },
      () => {
        setLocating(false);
        setBrowseError(
          'Location is blocked. Allow it in your browser, or set a home base on your account page.'
        );
      },
      { maximumAge: 60_000, timeout: 10_000 }
    );
  };

  const refreshLists = async () => {
    try {
      const response = await fetch('/api/v2/lists');
      if (!response.ok) return;
      const payload: { lists: ListSummary[] } = await response.json();
      setLists(payload.lists);
    } catch {
      // The next mutation or visit refreshes; stale counts are harmless.
    }
  };

  const createList = async () => {
    if (creating) return;
    const name = newName.trim();
    if (!name) {
      setNameError('Give the list a name');
      return;
    }
    setCreating(true);
    setNameError(null);
    try {
      const response = await fetch('/api/v2/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'create failed');
      }
      setNewName('');
      await refreshLists();
    } catch (err) {
      setNameError(
        err instanceof Error && err.message !== 'create failed'
          ? err.message
          : 'Could not start that list. Try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <section aria-label="Find places" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="type-board text-sm text-ink-muted">Places</p>
          <h1 className="type-board text-4xl text-ink sm:text-5xl">
            Your spots, on file
          </h1>
          <p className="max-w-lg text-ink-secondary">
            Find a place, keep it on a list, and the next fork starts itself.
          </p>
        </div>

        <Input
          label="Find a spot"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Sushi, taco truck, that one diner"
          maxLength={80}
          autoComplete="off"
        />

        {searching && (
          <SkeletonGroup label="Searching">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </SkeletonGroup>
        )}

        {!searching && searchError && (
          <p role="alert" className="text-sm text-danger">
            {searchError}
          </p>
        )}

        {!searching && !searchError && results && results.length === 0 && (
          <p role="status" className="text-sm text-ink-secondary">
            No matches for that. Try the place name or a cuisine.
          </p>
        )}

        {!searching && results && results.length > 0 && (
          <PlaceRows
            places={results}
            ariaLabel="Search results"
            savedNotes={savedNotes}
            onSave={setSavingPlace}
          />
        )}
      </section>

      <section
        aria-label="Browse nearby"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-ink">
            Or browse what&rsquo;s around
          </h2>
          <p className="max-w-lg text-sm text-ink-secondary">
            No name needed. Look around{' '}
            {anchor ? anchor.label : 'wherever you are'} and see what turns up.
          </p>
        </div>

        {!browseCenter && (
          <div className="flex flex-wrap gap-2">
            {anchor && (
              <Button
                variant="quiet"
                loading={browsing}
                onClick={() => void browse(anchor, browseVibe, browseRadius)}
              >
                Browse near home base
              </Button>
            )}
            <Button
              variant="quiet"
              loading={locating}
              onClick={browseFromDevice}
            >
              Use my location
            </Button>
            {!anchor && (
              <p className="w-full text-sm text-ink-muted">
                Set a home base on{' '}
                <Link
                  href="/account"
                  className="rounded underline underline-offset-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
                >
                  your account page
                </Link>{' '}
                and browsing starts from there without the location ask.
              </p>
            )}
          </div>
        )}

        {browseCenter && (
          <>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Browse filters"
            >
              {BROWSE_VIBES.map((vibe) => (
                <BrowseChip
                  key={vibe.label}
                  label={vibe.label}
                  selected={browseVibe === vibe.key}
                  onClick={() =>
                    void browse(browseCenter, vibe.key, browseRadius)
                  }
                />
              ))}
              <span aria-hidden className="self-center text-ink-muted">
                ·
              </span>
              {BROWSE_RADII.map((radius) => (
                <BrowseChip
                  key={radius.m}
                  label={radius.label}
                  selected={browseRadius === radius.m}
                  onClick={() =>
                    void browse(browseCenter, browseVibe, radius.m)
                  }
                />
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              Around {browseCenter.label}.
              {anchor && browseCenter.label !== anchor.label && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="rounded underline underline-offset-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
                    onClick={() =>
                      void browse(anchor, browseVibe, browseRadius)
                    }
                  >
                    Switch to home base
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {browsing && (
          <SkeletonGroup label="Looking around">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </SkeletonGroup>
        )}

        {!browsing && browseError && (
          <p role="alert" className="text-sm text-danger">
            {browseError}
          </p>
        )}

        {!browsing && !browseError && browseResults && (
          <>
            {browseResults.length === 0 ? (
              <p role="status" className="text-sm text-ink-secondary">
                Nothing on file there yet. Try the wider radius or a search by
                name.
              </p>
            ) : (
              <PlaceRows
                places={browseResults}
                ariaLabel="Nearby places"
                savedNotes={savedNotes}
                onSave={setSavingPlace}
              />
            )}
          </>
        )}
      </section>

      <section
        aria-label="Your lists"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <h2 className="text-xl font-semibold text-ink">Your lists</h2>

        {lists.filter((list) => list.role === 'owner').length === 0 ? (
          <EmptyState
            title="No lists yet"
            body="Save a place and start one. A list makes the next fork faster."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {lists
              .filter((list) => list.role === 'owner')
              .map((list) => (
                <li key={list.id}>
                  <ListRow list={list} />
                </li>
              ))}
          </ul>
        )}

        {lists.some((list) => list.role === 'collaborator') && (
          <>
            <h3 className="pt-2 font-semibold text-ink">Shared with you</h3>
            <ul className="flex flex-col gap-2">
              {lists
                .filter((list) => list.role === 'collaborator')
                .map((list) => (
                  <li key={list.id}>
                    <ListRow list={list} />
                  </li>
                ))}
            </ul>
          </>
        )}

        <form
          className="flex flex-col gap-2 sm:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void createList();
          }}
        >
          <Input
            label="Start a list"
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              if (nameError) setNameError(null);
            }}
            error={nameError ?? undefined}
            placeholder="Date night, lunch near work"
            maxLength={40}
          />
          <Button
            type="submit"
            variant="quiet"
            loading={creating}
            className="self-start"
          >
            Start it
          </Button>
        </form>
      </section>

      <section
        aria-label="Fork from here"
        className="flex flex-col gap-3 border-t border-line pt-8"
      >
        <p className="max-w-lg text-sm text-ink-secondary">
          Lists feed forks. Pick one as the source and the ballot fills itself.
        </p>
        <div>
          <ButtonLink href="/new" variant="quiet">
            Start a fork
          </ButtonLink>
        </div>
      </section>

      {savingPlace && (
        <SaveToListDialog
          open={savingPlace !== null}
          placeId={savingPlace.id}
          placeName={savingPlace.name}
          onClose={() => setSavingPlace(null)}
          onSaved={(listName) => {
            setSavedNotes((notes) => ({
              ...notes,
              [savingPlace.id]: listName,
            }));
            void refreshLists();
          }}
        />
      )}
    </main>
  );
}

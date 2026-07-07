'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  ButtonLink,
  Dialog,
  EmptyState,
  Input,
} from '@/components/v2/ui';
import type { PlaceSummary } from '@/lib/v2/http';
import { PlaceMeta } from './PlaceMeta';

/**
 * One list, managed: rename, delete, take places off. Removal is a single
 * tap (re-saving undoes it); deleting the list is the one irreversible act
 * here and gets the confirm dialog. The primary path out is forking from
 * this list — that button is the screen's one gold moment.
 *
 * Shared lists: the owner mints the invite link ("Share this list"), and
 * everyone on the list saves/removes/forks alike. Rename, delete, and
 * sharing stay the owner's, so a collaborator's view simply doesn't have
 * them.
 */

export interface ListDetailData {
  id: string;
  name: string;
  places: PlaceSummary[];
  role: 'owner' | 'collaborator';
  ownerFirstName: string;
  collaboratorCount: number;
}

export function ListDetail({ initial }: { initial: ListDetailData }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [places, setPlaces] = useState<PlaceSummary[]>(initial.places);
  const [error, setError] = useState<string | null>(null);

  const [shareState, setShareState] = useState<
    'idle' | 'working' | 'copied' | 'shown'
  >('idle');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const shareList = async () => {
    if (shareState === 'working') return;
    setShareState('working');
    setShareError(null);
    try {
      const response = await fetch(`/api/v2/lists/${initial.id}/invite`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error('invite failed');
      const url = `${window.location.origin}${payload.invitePath}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
      } catch {
        // Clipboard blocked — show the link so it can be copied by hand.
        setShareState('shown');
      }
    } catch {
      setShareState('idle');
      setShareError('Could not make an invite link. Try again.');
    }
  };

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(initial.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const rename = async () => {
    if (renaming) return;
    const next = renameValue.trim();
    if (!next) {
      setRenameError('Give the list a name');
      return;
    }
    setRenaming(true);
    setRenameError(null);
    try {
      const response = await fetch(`/api/v2/lists/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: next }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'rename failed');
      }
      setName(next);
      setRenameOpen(false);
    } catch (err) {
      setRenameError(
        err instanceof Error && err.message !== 'rename failed'
          ? err.message
          : 'Could not rename it. Try again.'
      );
    } finally {
      setRenaming(false);
    }
  };

  const deleteList = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/v2/lists/${initial.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('delete failed');
      router.push('/places');
      router.refresh();
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
      setError('Could not delete the list. Try again.');
    }
  };

  const removePlace = async (place: PlaceSummary) => {
    if (removingId) return;
    setRemovingId(place.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/v2/lists/${initial.id}/places/${place.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('remove failed');
      setPlaces((current) => current.filter((p) => p.id !== place.id));
    } catch {
      setError(`Could not take ${place.name} off the list. Try again.`);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2">
        <p className="type-board text-sm text-ink-muted">
          <Link
            href="/places"
            className="rounded outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
          >
            Places
          </Link>{' '}
          / list
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="type-board text-4xl text-ink sm:text-5xl">{name}</h1>
          <p className="tnum text-sm text-ink-muted">
            {places.length === 1 ? '1 place' : `${places.length} places`}
          </p>
        </div>
        {initial.role === 'collaborator' && (
          <p className="text-sm text-ink-secondary">
            Shared by {initial.ownerFirstName}. Anything you save here shows up
            for everyone on it.
          </p>
        )}
        {initial.role === 'owner' && initial.collaboratorCount > 0 && (
          <p className="text-sm text-ink-secondary">
            Shared with{' '}
            {initial.collaboratorCount === 1
              ? '1 person'
              : `${initial.collaboratorCount} people`}
            . They can save and remove places and fork the list.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {places.length >= 2 && (
          <ButtonLink href={`/new?list=${initial.id}`}>
            Fork this list
          </ButtonLink>
        )}
        {initial.role === 'owner' && (
          <>
            <Button
              variant="quiet"
              loading={shareState === 'working'}
              onClick={shareList}
            >
              Share this list
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setRenameValue(name);
                setRenameError(null);
                setRenameOpen(true);
              }}
            >
              Rename
            </Button>
            <Button variant="quiet" onClick={() => setDeleteOpen(true)}>
              Delete list
            </Button>
          </>
        )}
      </div>

      {shareState === 'copied' && (
        <p role="status" className="text-sm text-ink-secondary">
          Invite link copied. Anyone who opens it signed in joins this list. It
          works for 7 days.
        </p>
      )}
      {shareState === 'shown' && shareUrl && (
        <p role="status" className="text-sm text-ink-secondary break-all">
          Copy this invite link (works for 7 days): {shareUrl}
        </p>
      )}
      {shareError && (
        <p role="alert" className="text-sm text-danger">
          {shareError}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {places.length === 0 ? (
        <EmptyState
          title="Nothing on this list yet"
          body="Find spots in Places and keep them here."
          action={
            <ButtonLink href="/places" variant="quiet">
              Find places
            </ButtonLink>
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line" aria-label={name}>
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
              <Button
                variant="quiet"
                size="sm"
                className="shrink-0"
                loading={removingId === place.id}
                onClick={() => removePlace(place)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename this list"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void rename();
          }}
        >
          <Input
            label="List name"
            value={renameValue}
            onChange={(event) => {
              setRenameValue(event.target.value);
              if (renameError) setRenameError(null);
            }}
            error={renameError ?? undefined}
            maxLength={40}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="quiet" loading={renaming}>
              Rename it
            </Button>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Delete ${name}?`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-secondary">
            The list goes away. The places stay findable in search.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              loading={deleting}
              onClick={deleteList}
            >
              Delete it
            </Button>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  Input,
  Skeleton,
  SkeletonGroup,
} from '@/components/v2/ui';

/**
 * The one saving flow everywhere a place can be kept: pick a list or start
 * a new one, and the place lands on it. Saving is idempotent server-side,
 * so a double tap is safe. On success the dialog closes and the CALLER
 * shows the confirmation at the trigger (feedback where the tap happened,
 * per the manual).
 */

export interface ListSummary {
  id: string;
  name: string;
  placeCount: number;
  /** Owner or invited collaborator — shapes which controls render. */
  role: 'owner' | 'collaborator';
}

export function SaveToListDialog({
  open,
  placeId,
  placeName,
  onClose,
  onSaved,
}: {
  open: boolean;
  placeId: string;
  placeName: string;
  onClose: () => void;
  onSaved: (listName: string) => void;
}) {
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [busyListId, setBusyListId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const loadedFor = useRef<boolean>(false);

  useEffect(() => {
    if (!open) {
      loadedFor.current = false;
      return;
    }
    if (loadedFor.current) return;
    loadedFor.current = true;
    setLists(null);
    setError(null);
    setNameError(null);
    setNewName('');
    fetch('/api/v2/lists')
      .then(async (response) => {
        if (!response.ok) throw new Error('load failed');
        const payload: { lists: ListSummary[] } = await response.json();
        setLists(payload.lists);
      })
      .catch(() => setError('Your lists did not load. Close this and retry.'));
  }, [open]);

  const saveTo = async (list: ListSummary) => {
    if (busyListId) return;
    setBusyListId(list.id);
    setError(null);
    try {
      const response = await fetch(`/api/v2/lists/${list.id}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'save failed');
      }
      onSaved(list.name);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'save failed'
          ? err.message
          : 'Could not save that. Try again.'
      );
    } finally {
      setBusyListId(null);
    }
  };

  const createAndSave = async () => {
    if (creating) return;
    const name = newName.trim();
    if (!name) {
      setNameError('Give the list a name');
      return;
    }
    setCreating(true);
    setError(null);
    setNameError(null);
    try {
      const created = await fetch('/api/v2/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!created.ok) {
        const payload = await created.json().catch(() => null);
        throw new Error(payload?.error ?? 'create failed');
      }
      const payload: { list: ListSummary } = await created.json();
      // Surface the new list immediately so a failed follow-up save still
      // leaves a tappable row instead of a phantom list.
      setLists((current) =>
        current ? [payload.list, ...current] : [payload.list]
      );
      setNewName('');
      await saveTo(payload.list);
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'create failed'
          ? err.message
          : 'Could not start that list. Try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Keep ${placeName}`}>
      <div className="flex flex-col gap-4">
        {lists === null && !error ? (
          <SkeletonGroup label="Loading your lists">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </SkeletonGroup>
        ) : lists && lists.length > 0 ? (
          <ul className="flex flex-col gap-2" aria-label="Your lists">
            {lists.map((list) => (
              <li key={list.id}>
                <Button
                  variant="quiet"
                  className="w-full justify-between"
                  loading={busyListId === list.id}
                  onClick={() => saveTo(list)}
                >
                  <span className="truncate">{list.name}</span>
                  <span className="tnum text-sm text-ink-muted">
                    {list.placeCount}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        ) : lists ? (
          <p className="text-sm text-ink-secondary">
            No lists yet. Name one and this spot starts it.
          </p>
        ) : null}

        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void createAndSave();
          }}
        >
          <Input
            label="New list"
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              if (nameError) setNameError(null);
            }}
            error={nameError ?? undefined}
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

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/v2/ui';
import { cx } from '@/components/v2/ui/cx';

/**
 * The search anchor ("home base") form. Typing offers real addresses
 * (v1 behavior restored, owner ask 2026-07-06): a server-proxied
 * autocomplete under a per-burst session token, so people pick a
 * geocodable address instead of hoping their typo resolves. Picking is
 * optional — free-typed text still geocodes at save. Where the billing
 * gate is closed (dev/CI) the type-ahead quietly returns nothing and the
 * form degrades to plain typing with the honest save-time message.
 * Frame register like the rest of the account page.
 */

interface Suggestion {
  label: string;
  placeId: string;
}

const SUGGEST_DEBOUNCE_MS = 350;
const SUGGEST_MIN_CHARS = 3;

export function HomeBaseSection({
  initialLabel,
}: {
  initialLabel: string | null;
}) {
  const [savedLabel, setSavedLabel] = useState(initialLabel);
  const [address, setAddress] = useState(initialLabel ?? '');
  const [busy, setBusy] = useState<'save' | 'clear' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  /** The suggestion the current input text came from, if any. */
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const sessionRef = useRef<string | null>(null);
  const listId = useId();

  // Typing drives the visible state (open/cleared) synchronously in the
  // change handler (PlacesLane idiom — the set-state-in-effect rule);
  // this effect only owns the debounced fetch itself. Skipped for short
  // input and for text that IS a pick or the saved label (nothing new to
  // offer).
  useEffect(() => {
    const q = address.trim();
    if (
      q.length < SUGGEST_MIN_CHARS ||
      q === picked?.label ||
      q === savedLabel
    ) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        sessionRef.current ??=
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        const params = new URLSearchParams({
          q,
          session: sessionRef.current,
        });
        const response = await fetch(
          `/api/v2/places/address-autocomplete?${params}`
        );
        if (!response.ok) throw new Error('suggest failed');
        const payload: { suggestions: Suggestion[] } = await response.json();
        setSuggestions(payload.suggestions);
        setOpen(payload.suggestions.length > 0);
        setActiveIndex(-1);
      } catch {
        // Type-ahead is an assist, never a blocker — fail silent, the
        // save path reports real errors.
        setSuggestions([]);
        setOpen(false);
      }
    }, SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [address, picked, savedLabel]);

  const pick = (suggestion: Suggestion) => {
    setPicked(suggestion);
    setAddress(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + suggestions.length) % suggestions.length
      );
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const patch = async (body: {
    address: string | null;
    placeId?: string;
    sessionToken?: string;
  }) => {
    const response = await fetch('/api/v2/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? 'save failed');
    return payload.account.searchAnchorLabel as string | null;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = address.trim();
    if (busy || trimmed === '' || trimmed === savedLabel) return;
    setError(null);
    setSuccess(null);
    setOpen(false);
    setBusy('save');
    try {
      const label = await patch({
        address: trimmed,
        ...(picked && trimmed === picked.label
          ? {
              placeId: picked.placeId,
              sessionToken: sessionRef.current ?? undefined,
            }
          : {}),
      });
      setSavedLabel(label);
      setAddress(label ?? '');
      setPicked(null);
      sessionRef.current = null;
      setSuccess('Saved. Searches now start from here.');
    } catch (err) {
      setError(
        err instanceof Error && err.message !== 'save failed'
          ? err.message
          : 'Could not save that address. Try again.'
      );
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    if (busy) return;
    setError(null);
    setSuccess(null);
    setBusy('clear');
    try {
      await patch({ address: null });
      setSavedLabel(null);
      setAddress('');
      setPicked(null);
      sessionRef.current = null;
      setSuccess('Cleared. Searches are unanchored now.');
    } catch {
      setError('Could not clear it. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <form
      onSubmit={save}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      <div className="relative">
        <Input
          label="Home base"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          value={address}
          onChange={(event) => {
            const value = event.target.value;
            setAddress(value);
            setPicked(null);
            setSuccess(null);
            const q = value.trim();
            if (q.length < SUGGEST_MIN_CHARS || q === savedLabel) {
              setSuggestions([]);
              setOpen(false);
            }
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          error={error ?? undefined}
          success={success ?? undefined}
          help="Anchors restaurant search near you. Start typing and pick your address."
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Address suggestions"
            className="absolute top-full right-0 left-0 z-10 mt-1 flex flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.placeId}>
                <button
                  type="button"
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  // Keep the input focused: preventDefault on mousedown so
                  // blur doesn't close the list before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(suggestion)}
                  className={cx(
                    'w-full px-3 py-2.5 text-left text-sm text-ink outline-none',
                    'motion-safe:transition-colors motion-safe:duration-100',
                    index === activeIndex ? 'bg-sunken' : 'hover:bg-sunken'
                  )}
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="quiet"
          size="sm"
          type="submit"
          loading={busy === 'save'}
          disabled={
            busy !== null ||
            address.trim() === '' ||
            address.trim() === savedLabel
          }
        >
          Save home base
        </Button>
        {savedLabel !== null && (
          <Button
            variant="quiet"
            size="sm"
            type="button"
            loading={busy === 'clear'}
            disabled={busy !== null}
            onClick={clear}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}

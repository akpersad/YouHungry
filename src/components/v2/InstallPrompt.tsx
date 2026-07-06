'use client';

import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/v2/ui';

/**
 * In-context install nudge (WORKPLAN Phase 8: "tastefully, never on first
 * load"). Quiet frame work, no gold: installing is not a decision moment.
 *
 * Shows at most one of two shapes, and only from the second visit on:
 * - Chromium: after the browser fires `beforeinstallprompt` (which itself
 *   only fires when the app is installable and not installed), a card with
 *   a real install button driving the native prompt. The root layout's
 *   inline script stashes the early-firing event on window.
 * - iOS: no install API exists, so a one-line pointer at the only path
 *   there is (Share, then Add to Home Screen).
 * Anything else (desktop Safari/Firefox): nothing — no honest button to
 * offer. Dismissal is permanent; running installed (standalone) hides it.
 *
 * Hydration-safe the same way ThemeToggle is: all browser state comes in
 * through useSyncExternalStore (server snapshots hide the section), user
 * actions go through useState — no setState in effects.
 */

const VISITS_KEY = 'fitr-v2-visits';
const SESSION_KEY = 'fitr-v2-visit-counted';
const DISMISSED_KEY = 'fitr-v2-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallEventWindow = Window & {
  __fitrInstallEvent?: BeforeInstallPromptEvent;
};

const noopSubscribe = () => () => {};

/** Count this browser session toward the visit total exactly once. */
const subscribeVisitCount = (onChange: () => void) => {
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      const visits = (Number(localStorage.getItem(VISITS_KEY)) || 0) + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      onChange();
    }
  } catch {
    // storage blocked: stays a first visit, the section stays hidden
  }
  return () => {};
};

const readIsReturnVisit = () => {
  try {
    return (Number(localStorage.getItem(VISITS_KEY)) || 0) >= 2;
  } catch {
    return false;
  }
};

const readIsDismissed = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return true;
  }
};

const readIsStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  ('standalone' in navigator &&
    (navigator as { standalone?: boolean }).standalone === true);

// Every iOS browser is WebKit; CriOS/FxiOS install via the same Share sheet.
const readIsIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

const subscribeInstallEvent = (onChange: () => void) => {
  const listener = (event: Event) => {
    event.preventDefault();
    (window as InstallEventWindow).__fitrInstallEvent =
      event as BeforeInstallPromptEvent;
    onChange();
  };
  window.addEventListener('beforeinstallprompt', listener);
  return () => window.removeEventListener('beforeinstallprompt', listener);
};

const readInstallEvent = () =>
  (window as InstallEventWindow).__fitrInstallEvent ?? null;

export function InstallPrompt() {
  const returnVisit = useSyncExternalStore(
    subscribeVisitCount,
    readIsReturnVisit,
    () => false
  );
  const dismissed = useSyncExternalStore(
    noopSubscribe,
    readIsDismissed,
    () => true
  );
  const standalone = useSyncExternalStore(
    noopSubscribe,
    readIsStandalone,
    () => true
  );
  const ios = useSyncExternalStore(noopSubscribe, readIsIos, () => false);
  const installEvent = useSyncExternalStore(
    subscribeInstallEvent,
    readInstallEvent,
    () => null
  );
  const [hidden, setHidden] = useState(false);

  const shape =
    hidden || dismissed || standalone || !returnVisit
      ? 'none'
      : ios
        ? 'ios-hint'
        : installEvent
          ? 'button'
          : 'none';

  if (shape === 'none') return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // storage blocked: hiding for this page load is the best we can do
    }
    setHidden(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      dismiss();
    } else {
      setHidden(true); // quiet this session; not a permanent dismissal
    }
  };

  return (
    <section
      aria-label="Install the app"
      className="flex flex-col gap-3 border-t border-line pt-8"
    >
      <h2 className="text-xl font-semibold text-ink">Keep it one tap away</h2>
      <p className="max-w-lg text-sm text-ink-secondary">
        {shape === 'ios-hint'
          ? 'Put Fork In The Road on your home screen: tap Share, then Add to Home Screen.'
          : 'Put Fork In The Road on your home screen and settle dinner from the couch.'}
      </p>
      <div className="flex items-center gap-2">
        {shape === 'button' && (
          <Button variant="quiet" onClick={install}>
            Add to home screen
          </Button>
        )}
        <Button variant="ghost" onClick={dismiss}>
          No thanks
        </Button>
      </div>
    </section>
  );
}

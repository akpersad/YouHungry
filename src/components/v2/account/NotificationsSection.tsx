'use client';

import { useEffect, useState } from 'react';
import { Button, Switch } from '@/components/v2/ui';
import type { NotificationSettingsView } from '@/lib/v2/account';
import {
  isIos,
  isStandalone,
  pushSupported,
  toSubscriptionJson,
  urlBase64ToUint8Array,
} from './push';

/**
 * The notifications half of the account page. Two layers, honestly
 * separated: the channel switches (server-side, apply everywhere) and this
 * device's push registration (browser-side, one per device). Only two
 * notifications exist in the product (the result, and the crew-fork
 * start heads-up), so the copy names them instead of pretending there
 * is a matrix of options.
 */

/** What this browser can do about push, resolved after mount. */
type DeviceState =
  | 'checking'
  | 'unsupported' // no SW/Push/Notification API in this browser
  | 'ios-install' // iOS browser tab: push needs the Home Screen app
  | 'no-worker' // no service worker registration (dev builds)
  | 'blocked' // Notification permission denied at the browser level
  | 'off'
  | 'on';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function NotificationsSection({
  initialSettings,
  registeredEndpoints,
}: {
  initialSettings: NotificationSettingsView;
  registeredEndpoints: string[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingFlag, setSavingFlag] = useState<
    'pushEnabled' | 'emailEnabled' | null
  >(null);
  const [device, setDevice] = useState<DeviceState>('checking');
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve what this browser/device can do. Async reads, so this cannot
  // be a useSyncExternalStore snapshot like InstallPrompt's sync checks.
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!pushSupported()) {
        return isIos() && !isStandalone() ? 'ios-install' : 'unsupported';
      }
      if (isIos() && !isStandalone()) return 'ios-install';
      if (!VAPID_PUBLIC_KEY) return 'unsupported';
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return 'no-worker';
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) return 'on';
      return Notification.permission === 'denied' ? 'blocked' : 'off';
    };
    resolve()
      .then((state) => {
        if (!cancelled) setDevice(state);
      })
      .catch(() => {
        if (!cancelled) setDevice('unsupported');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Self-heal: a subscribed device the server has forgotten (pruned after
  // an expired send, or subscribed before an account existed) re-registers.
  useEffect(() => {
    if (device !== 'on') return;
    let cancelled = false;
    (async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      const json = subscription && toSubscriptionJson(subscription);
      if (!json || cancelled || registeredEndpoints.includes(json.endpoint)) {
        return;
      }
      await fetch('/api/v2/account/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      }).catch(() => undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [device, registeredEndpoints]);

  const saveFlag = async (flag: 'pushEnabled' | 'emailEnabled') => {
    if (savingFlag) return;
    const next = !settings[flag];
    setSavingFlag(flag);
    setError(null);
    // Optimistic: a settings flip should feel instant; roll back on failure.
    setSettings((current) => ({ ...current, [flag]: next }));
    try {
      const response = await fetch('/api/v2/account/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [flag]: next }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'save failed');
      setSettings(payload.notifications);
    } catch {
      setSettings((current) => ({ ...current, [flag]: !next }));
      setError('Could not save that. Try again.');
    } finally {
      setSavingFlag(null);
    }
  };

  const enableDevice = async () => {
    if (deviceBusy || !VAPID_PUBLIC_KEY) return;
    setDeviceBusy(true);
    setError(null);
    try {
      // The permission ask must ride the tap (iOS requires the gesture).
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setDevice(permission === 'denied' ? 'blocked' : 'off');
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setDevice('no-worker');
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = toSubscriptionJson(subscription);
      if (!json) throw new Error('subscription missing keys');
      const response = await fetch('/api/v2/account/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (!response.ok) {
        // The server never learned about it; leave the browser clean too.
        await subscription.unsubscribe().catch(() => undefined);
        throw new Error('register failed');
      }
      setDevice('on');
    } catch {
      setError('Could not turn on push for this device. Try again.');
    } finally {
      setDeviceBusy(false);
    }
  };

  const disableDevice = async () => {
    if (deviceBusy) return;
    setDeviceBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      const json = subscription && toSubscriptionJson(subscription);
      if (subscription) await subscription.unsubscribe();
      if (json) {
        await fetch('/api/v2/account/push-subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint }),
        }).catch(() => undefined); // send-time pruning covers a miss
      }
      setDevice('off');
    } catch {
      setError('Could not turn off push for this device. Try again.');
    } finally {
      setDeviceBusy(false);
    }
  };

  return (
    <section
      aria-label="Notifications"
      className="flex flex-col gap-4 border-t border-line pt-8"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink">Notifications</h2>
        <p className="max-w-lg text-sm text-ink-secondary">
          There are exactly two. When a fork you are part of closes, we say
          where the group is going. And when someone in one of your crews starts
          a fork, this is your heads-up to vote. The fork page always has both
          either way.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <Switch
          label="Push"
          description="Results, plus a heads-up when a crew fork starts. Sent to every device you turn on below."
          checked={settings.pushEnabled}
          busy={savingFlag === 'pushEnabled'}
          onChange={() => saveFlag('pushEnabled')}
        />
        <Switch
          label="Email results"
          description="One email per closed fork, nothing else. Crew starts never email."
          checked={settings.emailEnabled}
          busy={savingFlag === 'emailEnabled'}
          onChange={() => saveFlag('emailEnabled')}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <div>
          <h3 className="font-semibold text-ink">Push on this device</h3>
          <p className="text-sm text-ink-secondary">
            {device === 'checking' && 'Checking what this browser can do.'}
            {device === 'unsupported' &&
              'This browser cannot receive push notifications.'}
            {device === 'ios-install' &&
              'On iPhone and iPad, push needs the installed app. Tap Share, then Add to Home Screen, and turn push on from there.'}
            {device === 'no-worker' &&
              'Push registers from the installed production app, not this build.'}
            {device === 'blocked' &&
              'Notifications are blocked for this site in your browser settings. Allow them there, then come back.'}
            {device === 'off' &&
              'Turn it on and this device gets push notifications.'}
            {device === 'on' && 'This device gets push notifications.'}
          </p>
        </div>
        {device === 'off' && (
          <Button
            variant="quiet"
            size="sm"
            className="self-start"
            loading={deviceBusy}
            onClick={enableDevice}
          >
            Turn on for this device
          </Button>
        )}
        {device === 'on' && (
          <Button
            variant="quiet"
            size="sm"
            className="self-start"
            loading={deviceBusy}
            onClick={disableDevice}
          >
            Turn off for this device
          </Button>
        )}
      </div>
    </section>
  );
}

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The component reads the VAPID key at module load; jest.setup.js sets it.

jest.mock('../push', () => ({
  isIos: jest.fn(() => false),
  isStandalone: jest.fn(() => false),
  pushSupported: jest.fn(() => true),
  toSubscriptionJson: jest.fn(),
  urlBase64ToUint8Array: jest.fn(() => new Uint8Array([1])),
}));

import { NotificationsSection } from '../NotificationsSection';
import {
  isIos,
  isStandalone,
  pushSupported,
  toSubscriptionJson,
} from '../push';

const ENDPOINT = 'https://push.example/ep';
const SUBSCRIPTION_JSON = {
  endpoint: ENDPOINT,
  keys: { p256dh: 'p', auth: 'a' },
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

/** Install a controllable service worker registration + Notification. */
function setupBrowser({
  registration = null as null | {
    pushManager: {
      getSubscription: jest.Mock;
      subscribe?: jest.Mock;
    };
  },
  permission = 'default' as NotificationPermission,
  requestPermission = jest.fn(),
} = {}) {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { getRegistration: jest.fn(async () => registration ?? undefined) },
    configurable: true,
  });
  (global as { Notification?: unknown }).Notification = {
    permission,
    requestPermission,
  };
  return { requestPermission };
}

function renderSection({
  settings = { pushEnabled: true, emailEnabled: true },
  registeredEndpoints = [] as string[],
} = {}) {
  return render(
    <NotificationsSection
      initialSettings={settings}
      registeredEndpoints={registeredEndpoints}
    />
  );
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockImplementation(() => jsonResponse({}));
  (pushSupported as jest.Mock).mockReturnValue(true);
  (isIos as jest.Mock).mockReturnValue(false);
  (isStandalone as jest.Mock).mockReturnValue(false);
  (toSubscriptionJson as jest.Mock).mockReturnValue(SUBSCRIPTION_JSON);
});

afterEach(() => {
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  delete (global as { Notification?: unknown }).Notification;
});

describe('NotificationsSection device states', () => {
  it('reports a browser with no push APIs honestly', async () => {
    (pushSupported as jest.Mock).mockReturnValue(false);
    setupBrowser();
    renderSection();
    expect(
      await screen.findByText('This browser cannot receive push notifications.')
    ).toBeInTheDocument();
  });

  it('sends iOS browser tabs to the Home Screen app', async () => {
    (pushSupported as jest.Mock).mockReturnValue(false);
    (isIos as jest.Mock).mockReturnValue(true);
    setupBrowser();
    renderSection();
    expect(
      await screen.findByText(/push needs the installed app/i)
    ).toBeInTheDocument();
  });

  it('explains when no service worker is registered', async () => {
    setupBrowser({ registration: null });
    renderSection();
    expect(
      await screen.findByText(/registers from the installed production app/i)
    ).toBeInTheDocument();
  });

  it('surfaces a browser-level permission block', async () => {
    setupBrowser({
      registration: {
        pushManager: { getSubscription: jest.fn(async () => null) },
      },
      permission: 'denied',
    });
    renderSection();
    expect(
      await screen.findByText(/blocked for this site in your browser settings/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /turn on for this device/i })
    ).not.toBeInTheDocument();
  });
});

describe('NotificationsSection device enable/disable', () => {
  it('subscribes, registers with the server, and lands on the ON state', async () => {
    const subscribe = jest.fn(async () => ({ unsubscribe: jest.fn() }));
    const { requestPermission } = setupBrowser({
      registration: {
        pushManager: {
          getSubscription: jest.fn(async () => null),
          subscribe,
        },
      },
      requestPermission: jest.fn(async () => 'granted'),
    });
    renderSection({ registeredEndpoints: [ENDPOINT] });

    await userEvent.click(
      await screen.findByRole('button', { name: /turn on for this device/i })
    );

    expect(
      await screen.findByRole('button', { name: /turn off for this device/i })
    ).toBeInTheDocument();
    expect(requestPermission).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    );
    const post = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === '/api/v2/account/push-subscriptions' && init.method === 'POST'
    );
    expect(JSON.parse(post![1].body)).toEqual(SUBSCRIPTION_JSON);
  });

  it('moves to blocked when the permission ask is denied', async () => {
    setupBrowser({
      registration: {
        pushManager: {
          getSubscription: jest.fn(async () => null),
          subscribe: jest.fn(),
        },
      },
      requestPermission: jest.fn(async () => 'denied'),
    });
    renderSection();

    await userEvent.click(
      await screen.findByRole('button', { name: /turn on for this device/i })
    );

    expect(
      await screen.findByText(/blocked for this site in your browser settings/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('unsubscribes the browser again when the server rejects the registration', async () => {
    const unsubscribe = jest.fn(async () => true);
    setupBrowser({
      registration: {
        pushManager: {
          getSubscription: jest.fn(async () => null),
          subscribe: jest.fn(async () => ({ unsubscribe })),
        },
      },
      requestPermission: jest.fn(async () => 'granted'),
    });
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({}, false, 500)
    );
    renderSection();

    await userEvent.click(
      await screen.findByRole('button', { name: /turn on for this device/i })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not turn on push for this device. Try again.'
    );
    expect(unsubscribe).toHaveBeenCalled();
    // Still OFF: the button offers to turn on again.
    expect(
      screen.getByRole('button', { name: /turn on for this device/i })
    ).toBeInTheDocument();
  });

  it('turns off: unsubscribes and tells the server to forget the endpoint', async () => {
    const unsubscribe = jest.fn(async () => true);
    setupBrowser({
      registration: {
        pushManager: {
          getSubscription: jest.fn(async () => ({ unsubscribe })),
        },
      },
      permission: 'granted',
    });
    renderSection({ registeredEndpoints: [ENDPOINT] });

    await userEvent.click(
      await screen.findByRole('button', { name: /turn off for this device/i })
    );

    expect(
      await screen.findByRole('button', { name: /turn on for this device/i })
    ).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalled();
    const del = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === '/api/v2/account/push-subscriptions' && init.method === 'DELETE'
    );
    expect(JSON.parse(del![1].body)).toEqual({ endpoint: ENDPOINT });
  });

  it('self-heals a subscribed device the server has forgotten', async () => {
    setupBrowser({
      registration: {
        pushManager: {
          getSubscription: jest.fn(async () => ({ unsubscribe: jest.fn() })),
        },
      },
      permission: 'granted',
    });
    renderSection({ registeredEndpoints: [] });

    await waitFor(() => {
      const post = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          url === '/api/v2/account/push-subscriptions' && init.method === 'POST'
      );
      expect(post).toBeTruthy();
      expect(JSON.parse(post![1].body)).toEqual(SUBSCRIPTION_JSON);
    });
  });

  it('leaves an already-registered device alone', async () => {
    setupBrowser({
      registration: {
        pushManager: {
          getSubscription: jest.fn(async () => ({ unsubscribe: jest.fn() })),
        },
      },
      permission: 'granted',
    });
    renderSection({ registeredEndpoints: [ENDPOINT] });

    await screen.findByText('This device gets push notifications.');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('NotificationsSection channel switches', () => {
  it('flips a channel optimistically and keeps the server truth', async () => {
    setupBrowser();
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({
        notifications: { pushEnabled: false, emailEnabled: true },
      })
    );
    renderSection();
    await screen.findByText(/registers from the installed production app/i);

    await userEvent.click(screen.getByRole('switch', { name: 'Push' }));

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Push' })).toHaveAttribute(
        'aria-checked',
        'false'
      )
    );
    const patch = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/v2/account/preferences'
    );
    expect(patch![1].method).toBe('PATCH');
    expect(JSON.parse(patch![1].body)).toEqual({ pushEnabled: false });
  });

  it('rolls the switch back and reports when the save fails', async () => {
    setupBrowser();
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({}, false, 500)
    );
    renderSection();
    await screen.findByText(/registers from the installed production app/i);

    await userEvent.click(
      screen.getByRole('switch', { name: 'Email results' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save that. Try again.'
    );
    expect(
      screen.getByRole('switch', { name: 'Email results' })
    ).toHaveAttribute('aria-checked', 'true');
  });
});

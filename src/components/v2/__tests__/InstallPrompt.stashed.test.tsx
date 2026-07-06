import { render, screen } from '@testing-library/react';
import { InstallPrompt } from '../InstallPrompt';

// The pre-hydration stash path: beforeinstallprompt fired before the
// component mounted and the root layout's inline script parked it on
// window.__fitrInstallEvent.

describe('InstallPrompt (pre-hydration stash)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(window.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      configurable: true,
    });
  });

  afterEach(() => {
    delete (window as { __fitrInstallEvent?: unknown }).__fitrInstallEvent;
  });

  it('offers install from the stashed event without waiting for a re-fire', () => {
    localStorage.setItem('fitr-v2-visits', '2');
    sessionStorage.setItem('fitr-v2-visit-counted', '1');
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: jest.Mock;
      userChoice: Promise<{ outcome: string }>;
    };
    event.prompt = jest.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    (window as { __fitrInstallEvent?: unknown }).__fitrInstallEvent = event;

    render(<InstallPrompt />);
    expect(
      screen.getByRole('button', { name: 'Add to home screen' })
    ).toBeInTheDocument();
  });
});

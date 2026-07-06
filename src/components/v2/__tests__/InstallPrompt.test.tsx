import { render, screen, fireEvent, act } from '@testing-library/react';
import { InstallPrompt } from '../InstallPrompt';

// The component reads visit history from storage and the platform from the
// UA/matchMedia; each test arranges those, renders, and asserts the shape.

const VISITS_KEY = 'fitr-v2-visits';
const SESSION_KEY = 'fitr-v2-visit-counted';
const DISMISSED_KEY = 'fitr-v2-install-dismissed';

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    configurable: true,
  });
}

function markReturnVisit() {
  localStorage.setItem(VISITS_KEY, '2');
  sessionStorage.setItem(SESSION_KEY, '1');
}

function fireBeforeInstallPrompt(overrides?: {
  outcome?: 'accepted' | 'dismissed';
}) {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: jest.Mock;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = jest.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({
    outcome: overrides?.outcome ?? 'accepted',
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

const DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';

describe('InstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setUserAgent(DESKTOP_CHROME);
    // The subscribe listener stashes the event on window (deliberately
    // persistent across mounts in production); tests need a clean slate.
    delete (window as { __fitrInstallEvent?: unknown }).__fitrInstallEvent;
  });

  it('renders nothing on a first visit even if the browser offers install', () => {
    render(<InstallPrompt />);
    fireBeforeInstallPrompt();
    expect(screen.queryByText(/keep it one tap away/i)).toBeNull();
    // ...but the visit was counted toward next time.
    expect(localStorage.getItem(VISITS_KEY)).toBe('1');
  });

  it('renders nothing on a return visit until the browser offers install', () => {
    markReturnVisit();
    render(<InstallPrompt />);
    expect(screen.queryByText(/keep it one tap away/i)).toBeNull();
  });

  it('shows the install button on a return visit once beforeinstallprompt fires', () => {
    markReturnVisit();
    render(<InstallPrompt />);
    fireBeforeInstallPrompt();
    expect(
      screen.getByRole('button', { name: 'Add to home screen' })
    ).toBeInTheDocument();
  });

  it('drives the native prompt and dismisses permanently on accept', async () => {
    markReturnVisit();
    render(<InstallPrompt />);
    const event = fireBeforeInstallPrompt({ outcome: 'accepted' });
    fireEvent.click(screen.getByRole('button', { name: 'Add to home screen' }));
    await act(async () => {});
    expect(event.prompt).toHaveBeenCalled();
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('1');
    expect(screen.queryByText(/keep it one tap away/i)).toBeNull();
  });

  it('hides quietly without a permanent dismissal when the native prompt is declined', async () => {
    markReturnVisit();
    render(<InstallPrompt />);
    fireBeforeInstallPrompt({ outcome: 'dismissed' });
    fireEvent.click(screen.getByRole('button', { name: 'Add to home screen' }));
    await act(async () => {});
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
    expect(screen.queryByText(/keep it one tap away/i)).toBeNull();
  });

  it('shows the Share sheet hint on iOS instead of a dead button', () => {
    setUserAgent(IPHONE_SAFARI);
    markReturnVisit();
    render(<InstallPrompt />);
    expect(screen.getByText(/add to home screen\./i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add to home screen' })
    ).toBeNull();
  });

  it('"No thanks" dismisses permanently', () => {
    setUserAgent(IPHONE_SAFARI);
    markReturnVisit();
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'No thanks' }));
    expect(localStorage.getItem(DISMISSED_KEY)).toBe('1');
    expect(screen.queryByText(/keep it one tap away/i)).toBeNull();
  });

  it('never renders again after a dismissal', () => {
    setUserAgent(IPHONE_SAFARI);
    markReturnVisit();
    localStorage.setItem(DISMISSED_KEY, '1');
    render(<InstallPrompt />);
    expect(screen.queryByText(/keep it one tap away/i)).toBeNull();
  });
});

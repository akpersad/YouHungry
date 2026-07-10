import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountLane } from '../AccountLane';
import type { AccountView } from '@/lib/v2/account';

// Sign out (relocated here from the header) routes home after Clerk ends
// the session; jsdom has no app router mounted.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const ACCOUNT: AccountView = {
  firstName: 'Sam',
  name: 'Sam Squad',
  email: 'sam@example.com',
  searchAnchorLabel: null,
  notifications: { pushEnabled: true, emailEnabled: true },
  pushEndpoints: [],
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockImplementation(() => jsonResponse({}));
});

async function renderLane(account: AccountView = ACCOUNT) {
  render(<AccountLane account={account} />);
  // Let the notifications device probe settle (jsdom has no push APIs).
  await screen.findByText('This browser cannot receive push notifications.');
}

describe('AccountLane', () => {
  it('lays out the whole account surface', async () => {
    await renderLane();
    expect(
      screen.getByRole('heading', { name: 'Your details, your call' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Sam');
    expect(screen.getByText('sam@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/home base/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Push' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'privacy page' })).toHaveAttribute(
      'href',
      '/privacy'
    );
    // Sign out lives here, not in the header (phone-width shell).
    expect(
      screen.getByRole('button', { name: 'Sign out' })
    ).toBeInTheDocument();
  });

  it('keeps Save name disabled until the name actually changes', async () => {
    await renderLane();
    const save = screen.getByRole('button', { name: 'Save name' });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/first name/i), 'antha');
    expect(save).toBeEnabled();

    await userEvent.clear(screen.getByLabelText(/first name/i));
    expect(save).toBeDisabled();
  });

  it('saves the first name and adopts the server echo', async () => {
    await renderLane();
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({ account: { firstName: 'Samantha' } })
    );

    const input = screen.getByLabelText(/first name/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'Samantha');
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    expect(input).toHaveValue('Samantha');
    const patch = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/v2/account'
    );
    expect(patch![1].method).toBe('PATCH');
    expect(JSON.parse(patch![1].body)).toEqual({ firstName: 'Samantha' });
  });

  it('shows the server complaint when the name save is rejected', async () => {
    await renderLane();
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({ error: 'First name is required.' }, false, 400)
    );

    const input = screen.getByLabelText(/first name/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(
      await screen.findByText('First name is required.')
    ).toBeInTheDocument();
  });

  it('falls back to generic copy on an unexplained failure', async () => {
    await renderLane();
    (global.fetch as jest.Mock).mockImplementation(() =>
      jsonResponse({}, false, 500)
    );

    const input = screen.getByLabelText(/first name/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'Sammy');
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(
      await screen.findByText('Could not save your name. Try again.')
    ).toBeInTheDocument();
  });
});

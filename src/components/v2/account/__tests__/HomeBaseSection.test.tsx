import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeBaseSection } from '../HomeBaseSection';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

/** Route the global fetch mock by URL: type-ahead vs the account PATCH. */
function routeFetch({
  suggestions = [] as { label: string; placeId: string }[],
  patch = () => jsonResponse({ account: { searchAnchorLabel: null } }),
}: {
  suggestions?: { label: string; placeId: string }[];
  patch?: () => Promise<unknown>;
} = {}) {
  (global.fetch as jest.Mock).mockImplementation((url: string) =>
    url.startsWith('/api/v2/places/address-autocomplete')
      ? jsonResponse({ suggestions })
      : patch()
  );
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

const SUGGESTION = {
  label: '123 Main St, Springfield, IL, USA',
  placeId: 'place-123',
};

describe('HomeBaseSection', () => {
  it('starts from the saved label and disables save until the text changes', () => {
    routeFetch();
    render(<HomeBaseSection initialLabel="10 Old Rd, Boston, MA, USA" />);
    expect(screen.getByRole('combobox')).toHaveValue(
      '10 Old Rd, Boston, MA, USA'
    );
    expect(
      screen.getByRole('button', { name: 'Save home base' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled();
  });

  it('has no Clear button before an anchor exists', () => {
    routeFetch();
    render(<HomeBaseSection initialLabel={null} />);
    expect(
      screen.queryByRole('button', { name: 'Clear' })
    ).not.toBeInTheDocument();
  });

  it('offers suggestions after the debounce and picking one fills the input', async () => {
    routeFetch({ suggestions: [SUGGESTION] });
    render(<HomeBaseSection initialLabel={null} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, '123 Main');
    const option = await screen.findByRole('option', {
      name: SUGGESTION.label,
    });

    const suggestUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const params = new URL(suggestUrl, 'http://localhost').searchParams;
    expect(params.get('q')).toBe('123 Main');
    expect(params.get('session')).toBeTruthy();

    await userEvent.click(option);
    expect(input).toHaveValue(SUGGESTION.label);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not ask for suggestions under three characters', async () => {
    routeFetch({ suggestions: [SUGGESTION] });
    render(<HomeBaseSection initialLabel={null} />);

    await userEvent.type(screen.getByRole('combobox'), '12');
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports arrow keys, Enter to pick, and Escape to dismiss', async () => {
    const second = { label: '123 Main Ave, Portland, OR, USA', placeId: 'p2' };
    routeFetch({ suggestions: [SUGGESTION, second] });
    render(<HomeBaseSection initialLabel={null} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, '123 Main');
    await screen.findByRole('listbox');

    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');
    expect(
      screen.getByRole('option', { name: SUGGESTION.label })
    ).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Typing again re-fetches; Enter takes the highlighted row.
    await userEvent.type(input, ' ');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue(SUGGESTION.label);
  });

  it('saves a picked suggestion with its placeId and session token', async () => {
    routeFetch({
      suggestions: [SUGGESTION],
      patch: () =>
        jsonResponse({ account: { searchAnchorLabel: SUGGESTION.label } }),
    });
    render(<HomeBaseSection initialLabel={null} />);

    await userEvent.type(screen.getByRole('combobox'), '123 Main');
    await userEvent.click(
      await screen.findByRole('option', { name: SUGGESTION.label })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Save home base' })
    );

    expect(
      await screen.findByText('Saved. Searches now start from here.')
    ).toBeInTheDocument();
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/v2/account'
    );
    const body = JSON.parse(patchCall![1].body);
    expect(body.address).toBe(SUGGESTION.label);
    expect(body.placeId).toBe(SUGGESTION.placeId);
    expect(body.sessionToken).toBeTruthy();
  });

  it('saves free-typed text without a placeId', async () => {
    routeFetch({
      suggestions: [],
      patch: () =>
        jsonResponse({
          account: { searchAnchorLabel: '456 Elm St, Austin, TX, USA' },
        }),
    });
    render(<HomeBaseSection initialLabel={null} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, '456 elm st austin');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save home base' })
    );

    expect(
      await screen.findByText('Saved. Searches now start from here.')
    ).toBeInTheDocument();
    // The input adopts the server's geocoded label.
    expect(input).toHaveValue('456 Elm St, Austin, TX, USA');
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/v2/account'
    );
    const body = JSON.parse(patchCall![1].body);
    expect(body).toEqual({ address: '456 elm st austin' });
  });

  it('shows the server message when a save is rejected with one', async () => {
    routeFetch({
      patch: () =>
        jsonResponse(
          { error: 'We could not find that address. Add city or zip.' },
          false,
          422
        ),
    });
    render(<HomeBaseSection initialLabel={null} />);

    await userEvent.type(screen.getByRole('combobox'), 'nowhere');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save home base' })
    );

    expect(
      await screen.findByText(
        'We could not find that address. Add city or zip.'
      )
    ).toBeInTheDocument();
  });

  it('falls back to generic copy when the failure has no message', async () => {
    routeFetch({ patch: () => jsonResponse({}, false, 500) });
    render(<HomeBaseSection initialLabel={null} />);

    await userEvent.type(screen.getByRole('combobox'), 'somewhere else');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save home base' })
    );

    expect(
      await screen.findByText('Could not save that address. Try again.')
    ).toBeInTheDocument();
  });

  it('clears the anchor and removes the Clear button', async () => {
    routeFetch({
      patch: () => jsonResponse({ account: { searchAnchorLabel: null } }),
    });
    render(<HomeBaseSection initialLabel="10 Old Rd, Boston, MA, USA" />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      await screen.findByText('Cleared. Searches are unanchored now.')
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: 'Clear' })
    ).not.toBeInTheDocument();
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => url === '/api/v2/account'
    );
    expect(JSON.parse(patchCall![1].body)).toEqual({ address: null });
  });

  it('reports failure to clear without dropping the saved anchor', async () => {
    routeFetch({ patch: () => jsonResponse({}, false, 500) });
    render(<HomeBaseSection initialLabel="10 Old Rd, Boston, MA, USA" />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      await screen.findByText('Could not clear it. Try again.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('stays quiet when the type-ahead itself fails', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('network down'))
    );
    render(<HomeBaseSection initialLabel={null} />);

    await userEvent.type(screen.getByRole('combobox'), '123 Main');
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

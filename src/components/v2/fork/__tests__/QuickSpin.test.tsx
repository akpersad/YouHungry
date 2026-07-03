import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickSpin } from '../QuickSpin';

// @clerk/nextjs resolves to src/__mocks__/@clerk/nextjs.js (signed-in).

const PLACES = [
  {
    id: 'a'.repeat(24),
    name: 'Sushi Yama',
    address: '1 Fixture Ave',
    categories: ['sushi'],
    priceLevel: 2,
    rating: 4.6,
  },
  {
    id: 'b'.repeat(24),
    name: 'Taco Bravo',
    address: '2 Fixture Ave',
    categories: ['tacos'],
    priceLevel: 1,
    rating: 4.4,
  },
];

function mockGeolocation(
  impl: (success: PositionCallback, error: PositionErrorCallback) => void
) {
  Object.defineProperty(global.navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: jest.fn(impl) },
  });
}

function grantLocation() {
  mockGeolocation((success) =>
    success({
      coords: { latitude: 40.76, longitude: -73.92 },
    } as GeolocationPosition)
  );
}

function spinResponse(places = PLACES, winnerId = PLACES[0].id) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        places,
        spin:
          places.length > 0
            ? {
                winnerPlaceId: winnerId,
                weights: Object.fromEntries(places.map((p) => [p.id, 1])),
                reasoning: 'test',
              }
            : null,
      }),
  };
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

describe('QuickSpin', () => {
  it('spins near me and reveals a winner with lock-in and spin-again', async () => {
    const user = userEvent.setup();
    grantLocation();
    (global.fetch as jest.Mock).mockResolvedValue(spinResponse());

    render(<QuickSpin />);
    await user.click(screen.getByRole('button', { name: 'Spin near me' }));

    // The board is up — skip the theater.
    await user.click(
      await screen.findByRole('button', { name: 'Skip to the result' })
    );

    expect(await screen.findByText('1 Fixture Ave')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock it in' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Spin again' })).toBeEnabled();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v2/quick-spin',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('locks the result in and confirms', async () => {
    const user = userEvent.setup();
    grantLocation();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(spinResponse())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ code: 'abc123defg' }),
      });

    render(<QuickSpin />);
    await user.click(screen.getByRole('button', { name: 'Spin near me' }));
    await user.click(
      await screen.findByRole('button', { name: 'Skip to the result' })
    );
    await user.click(screen.getByRole('button', { name: 'Lock it in' }));

    expect(
      await screen.findByText(/Locked in\. This one counts/)
    ).toBeInTheDocument();
    const lockCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(lockCall[0]).toBe('/api/v2/quick-spin/lock');
    expect(JSON.parse(lockCall[1].body)).toMatchObject({
      winnerPlaceId: PLACES[0].id,
      optionPlaceIds: [PLACES[0].id, PLACES[1].id],
    });
  });

  it('explains a blocked location without a dead end', async () => {
    const user = userEvent.setup();
    mockGeolocation((_success, error) =>
      error({ code: 1 } as GeolocationPositionError)
    );

    render(<QuickSpin />);
    await user.click(screen.getByRole('button', { name: 'Spin near me' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Location is blocked'
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows an invitation when no places are nearby', async () => {
    const user = userEvent.setup();
    grantLocation();
    (global.fetch as jest.Mock).mockResolvedValue(spinResponse([]));

    render(<QuickSpin />);
    await user.click(screen.getByRole('button', { name: 'Spin near me' }));

    expect(
      await screen.findByText('No spots near you yet')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a fork' })).toBeVisible();
  });

  it('sends the selected vibe with the spin', async () => {
    const user = userEvent.setup();
    grantLocation();
    (global.fetch as jest.Mock).mockResolvedValue(spinResponse());

    render(<QuickSpin />);
    await user.click(screen.getByRole('button', { name: 'Cheap eats' }));
    await user.click(screen.getByRole('button', { name: 'Spin near me' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.vibe).toBe('cheap');
  });
});

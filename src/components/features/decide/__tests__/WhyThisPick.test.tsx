import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WhyThisPick } from '../WhyThisPick';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

const weights = [
  {
    restaurantId: 'r1',
    name: 'Pho House',
    currentWeight: 1.0,
    selectionCount: 0,
    daysUntilFullWeight: 0,
  },
  {
    restaurantId: 'r2',
    name: 'Taco Cart',
    currentWeight: 0.5,
    selectionCount: 3,
    lastSelected: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    daysUntilFullWeight: 25,
  },
];

describe('WhyThisPick', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, weights }),
    }) as jest.Mock;
  });

  afterEach(() => jest.restoreAllMocks());

  it('shows the relative-chance percentage for the picked restaurant', async () => {
    renderWithClient(<WhyThisPick collectionId="c1" restaurantId="r2" />);
    // r2 weight 0.5 / max 1.0 = 50%
    await waitFor(() => expect(screen.getByText('50%')).toBeInTheDocument());
    expect(screen.getByText('Why this pick?')).toBeInTheDocument();
  });

  it('describes recency and selection count', async () => {
    renderWithClient(<WhyThisPick collectionId="c1" restaurantId="r2" />);
    await waitFor(() =>
      expect(screen.getByText(/Last picked 5 days ago/)).toBeInTheDocument()
    );
    expect(screen.getByText(/Picked 3 times/)).toBeInTheDocument();
  });

  it('calls out a never-picked restaurant as a fresh choice', async () => {
    renderWithClient(<WhyThisPick collectionId="c1" restaurantId="r1" />);
    await waitFor(() =>
      expect(screen.getByText(/Never picked before/)).toBeInTheDocument()
    );
  });
});

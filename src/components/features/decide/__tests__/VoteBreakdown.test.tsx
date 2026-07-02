import { render, screen } from '@testing-library/react';
import { VoteBreakdown } from '../VoteBreakdown';

const restaurants = [
  { _id: 'r1', name: 'Trattoria' },
  { _id: 'r2', name: 'Taqueria' },
];

describe('VoteBreakdown', () => {
  it('renders an empty message when nothing was ranked', () => {
    render(<VoteBreakdown breakdown={{}} restaurants={restaurants} />);
    expect(
      screen.getByText('No ranked votes were recorded.')
    ).toBeInTheDocument();
  });

  it('lists restaurants sorted by total points with per-rank tallies', () => {
    render(
      <VoteBreakdown
        breakdown={{
          r1: { first: 2, second: 0, third: 0, total: 6 },
          r2: { first: 0, second: 1, third: 1, total: 3 },
        }}
        restaurants={restaurants}
        winnerId="r1"
      />
    );

    expect(screen.getByText('How votes fell')).toBeInTheDocument();
    expect(screen.getByText('Trattoria')).toBeInTheDocument();
    expect(screen.getByText('6 pts')).toBeInTheDocument();
    expect(screen.getByText('2 × 1st · 0 × 2nd · 0 × 3rd')).toBeInTheDocument();
    // Singular "pt" for a single point
    render(
      <VoteBreakdown
        breakdown={{ r1: { first: 0, second: 0, third: 1, total: 1 } }}
        restaurants={restaurants}
      />
    );
    expect(screen.getByText('1 pt')).toBeInTheDocument();
  });

  it('falls back to a label when a ranked restaurant was removed', () => {
    render(
      <VoteBreakdown
        breakdown={{ gone: { first: 1, second: 0, third: 0, total: 3 } }}
        restaurants={restaurants}
      />
    );
    expect(screen.getByText('Removed restaurant')).toBeInTheDocument();
  });
});

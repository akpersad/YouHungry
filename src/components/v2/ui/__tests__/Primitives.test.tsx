import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { Skeleton, SkeletonGroup } from '../Skeleton';
import { EmptyState } from '../EmptyState';
import { Button } from '../Button';

describe('v2 Card', () => {
  it('raised carries elevation; outline carries a hairline instead', () => {
    const { rerender } = render(<Card data-testid="card">Body</Card>);
    expect(screen.getByTestId('card').className).toContain('shadow-lift');
    rerender(
      <Card data-testid="card" variant="outline">
        Body
      </Card>
    );
    const el = screen.getByTestId('card');
    expect(el.className).toContain('border-line');
    expect(el.className).not.toContain('shadow-lift');
  });
});

describe('v2 Skeleton', () => {
  it('blocks are decorative; the group announces loading exactly once', () => {
    render(
      <SkeletonGroup label="Loading places">
        <Skeleton data-testid="block" className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </SkeletonGroup>
    );
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading places');
    expect(screen.getByTestId('block')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('v2 EmptyState', () => {
  it('is an invitation: title, body, and one action', () => {
    render(
      <EmptyState
        title="No lists yet"
        body="Save a place and start one."
        action={<Button>Find places</Button>}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'No lists yet' })
    ).toBeInTheDocument();
    expect(screen.getByText('Save a place and start one.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Find places' })
    ).toBeInTheDocument();
  });
});

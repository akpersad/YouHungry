import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonGroup, CollectionListSkeleton } from '../Skeleton';

describe('Skeleton primitives', () => {
  it('renders a decorative shimmer block hidden from assistive tech', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const block = container.firstChild as HTMLElement;
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).not.toHaveAttribute('role');
  });

  it('SkeletonGroup announces its label once as a status region', () => {
    render(
      <SkeletonGroup label="Loading collections">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </SkeletonGroup>
    );
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-label', 'Loading collections');
    expect(region).toHaveAttribute('aria-busy', 'true');
    // Exactly one status region, regardless of how many blocks it wraps.
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('CollectionListSkeleton exposes a single loading region', () => {
    render(<CollectionListSkeleton count={3} />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading collections'
    );
    expect(screen.getAllByTestId('collection-card-skeleton')).toHaveLength(3);
  });
});

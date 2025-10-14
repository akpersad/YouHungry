import { render, screen } from '@testing-library/react';
import { UserProfile } from '../UserProfile';

// Mock the Clerk UserButton
jest.mock('@clerk/nextjs', () => ({
  UserButton: ({ appearance }: { appearance: Record<string, unknown> }) => (
    <div
      data-testid="clerk-user-button"
      data-appearance={JSON.stringify(appearance)}
    >
      User Button
    </div>
  ),
}));

describe('UserProfile', () => {
  it('renders UserButton component', () => {
    render(<UserProfile />);

    expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument();
    expect(screen.getByText('User Button')).toBeInTheDocument();
  });

  it('applies custom appearance configuration', () => {
    render(<UserProfile />);

    const userButton = screen.getByTestId('clerk-user-button');
    const appearance = JSON.parse(
      userButton.getAttribute('data-appearance') || '{}'
    );

    expect(appearance.elements?.userButtonAvatarBox).toBe('w-10 h-10');
    expect(appearance.variables?.colorPrimary).toBe('var(--accent-primary)');
  });

  it('renders within a container with proper styling', () => {
    render(<UserProfile />);

    const userButton = screen.getByTestId('clerk-user-button');
    const container = userButton.parentElement;
    expect(container).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center'
    );
  });
});

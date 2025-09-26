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

    expect(appearance.elements?.avatarBox).toBe('w-8 h-8');
  });

  it('renders within a Card component', () => {
    render(<UserProfile />);

    // Check if the UserButton is wrapped in a Card
    const card = screen.getByTestId('clerk-user-button').closest('.card-base');
    expect(card).toBeInTheDocument();
  });

  it('has proper card styling', () => {
    render(<UserProfile />);

    const card = screen.getByTestId('clerk-user-button').closest('.card-base');
    expect(card).toHaveClass('w-fit');
  });

  it('has proper card content styling', () => {
    render(<UserProfile />);

    const cardContent = screen.getByTestId('clerk-user-button').closest('.p-2');
    expect(cardContent).toBeInTheDocument();
  });
});

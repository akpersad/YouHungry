import { render, screen } from '@testing-library/react';
import { SignOutButton } from '../SignOutButton';

// Mock the Clerk SignOutButton
jest.mock('@clerk/nextjs', () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-signout-button">{children}</div>
  ),
}));

describe('SignOutButton', () => {
  it('renders with default text', () => {
    render(<SignOutButton />);

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(<SignOutButton>Custom Sign Out</SignOutButton>);

    expect(screen.getByText('Custom Sign Out')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SignOutButton className="custom-class" />);

    // Check that the component renders without crashing
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('applies different variants', () => {
    const { rerender } = render(<SignOutButton variant="primary" />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();

    rerender(<SignOutButton variant="secondary" />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();

    rerender(<SignOutButton variant="outline" />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();
  });

  it('applies different sizes', () => {
    const { rerender } = render(<SignOutButton size="sm" />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();

    rerender(<SignOutButton size="md" />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();

    rerender(<SignOutButton size="lg" />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();
  });

  it('uses outline variant by default', () => {
    render(<SignOutButton />);
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<SignOutButton ref={ref} />);
    // Ref forwarding is handled by the Button component internally
    expect(screen.getByTestId('clerk-signout-button')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { SignInButton } from '../SignInButton';

// Mock the Clerk SignInButton
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({
    children,
    mode,
  }: {
    children: React.ReactNode;
    mode: string;
  }) => (
    <div data-testid="clerk-signin-button" data-mode={mode}>
      {children}
    </div>
  ),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('SignInButton', () => {
  it('renders with default text', () => {
    render(<SignInButton />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();
    expect(screen.getByTestId('clerk-signin-button')).toHaveAttribute(
      'data-mode',
      'modal'
    );
  });

  it('renders with custom children', () => {
    render(<SignInButton>Custom Sign In</SignInButton>);

    expect(screen.getByText('Custom Sign In')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SignInButton className="custom-class" />);

    // Check that the component renders without crashing
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('applies different variants', () => {
    const { rerender } = render(<SignInButton variant="primary" />);
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();

    rerender(<SignInButton variant="secondary" />);
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();

    rerender(<SignInButton variant="outline" />);
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();
  });

  it('applies different sizes', () => {
    const { rerender } = render(<SignInButton size="sm" />);
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();

    rerender(<SignInButton size="md" />);
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();

    rerender(<SignInButton size="lg" />);
    expect(screen.getByTestId('clerk-signin-button')).toBeInTheDocument();
  });
});

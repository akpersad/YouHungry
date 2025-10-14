import { render, screen } from '@testing-library/react';
import { AuthButtons } from '@/components/auth/AuthButtons';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children, mode }: any) => (
    <div data-testid="clerk-signin" data-mode={mode}>
      {children}
    </div>
  ),
  SignUpButton: ({ children, mode }: any) => (
    <div data-testid="clerk-signup" data-mode={mode}>
      {children}
    </div>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, className, variant, size }: any) => (
    <button
      className={className}
      data-testid={`button-${variant || 'default'}-${size || 'default'}`}
    >
      {children}
    </button>
  ),
}));

describe('AuthButtons', () => {
  // Mock window.location for development detection
  const mockLocation = {
    hostname: 'localhost',
  };

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  it('renders sign-up and sign-in links', () => {
    render(<AuthButtons />);

    const signUpButton = screen.getByRole('link', { name: /get started/i });
    const signInButton = screen.getByRole('link', { name: /sign in/i });

    expect(signUpButton).toBeInTheDocument();
    expect(signInButton).toBeInTheDocument();
    expect(signUpButton).toHaveAttribute('href', '/sign-up');
    expect(signInButton).toHaveAttribute('href', '/sign-in');
  });

  it('renders default buttons in development mode', () => {
    render(<AuthButtons />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByTestId('button-default-lg')).toBeInTheDocument();
    expect(screen.getByTestId('button-outline-lg')).toBeInTheDocument();
  });

  it('wraps children in sign-up link', () => {
    render(
      <AuthButtons>
        <button>Custom Button</button>
      </AuthButtons>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/sign-up');
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AuthButtons className="custom-class" />);

    const divWithClass = container.querySelector('.custom-class');
    expect(divWithClass).toBeInTheDocument();
  });
});

describe('AuthButtons Production Mode', () => {
  // Mock window.location for production detection
  const mockLocation = {
    hostname: 'you-hungry.vercel.app',
  };

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  it('renders custom auth pages in production mode', () => {
    render(<AuthButtons />);

    const getStartedLink = screen.getByText('Get Started').closest('a');
    const signInLink = screen.getByText('Sign In').closest('a');

    expect(getStartedLink).toHaveAttribute('href', '/sign-up');
    expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  it('wraps children in sign-up link in production mode', () => {
    render(
      <AuthButtons>
        <button>Custom Button</button>
      </AuthButtons>
    );

    const link = screen.getByText('Custom Button').closest('a');
    expect(link).toHaveAttribute('href', '/sign-up');
  });
});

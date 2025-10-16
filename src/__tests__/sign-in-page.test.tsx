import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignInPage from '@/app/sign-in/[[...rest]]/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignIn: ({ appearance, fallbackRedirectUrl, signUpUrl }: any) => (
    <div data-testid="clerk-signin">
      <div data-testid="redirect-url">{fallbackRedirectUrl}</div>
      <div data-testid="signup-url">{signUpUrl}</div>
      <div data-testid="appearance-config">{JSON.stringify(appearance)}</div>
    </div>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, variant }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-testid={`button-${variant || 'default'}`}
    >
      {children}
    </button>
  ),
}));

describe('SignInPage', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  it('renders the sign-in page with correct title and description', () => {
    render(<SignInPage />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to continue to Fork In The Road')
    ).toBeInTheDocument();
  });

  it('renders the Clerk SignIn component with correct configuration', () => {
    render(<SignInPage />);

    const clerkSignIn = screen.getByTestId('clerk-signin');
    expect(clerkSignIn).toBeInTheDocument();

    expect(screen.getByTestId('redirect-url')).toHaveTextContent('/dashboard');
    expect(screen.getByTestId('signup-url')).toHaveTextContent('/sign-up');
  });

  it('has a back to home button that navigates correctly', () => {
    render(<SignInPage />);

    const backButton = screen.getByText('← Back to Home');
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('renders terms and privacy policy text', () => {
    render(<SignInPage />);

    expect(
      screen.getByText(
        /By signing in, you agree to our Terms of Service and Privacy Policy/
      )
    ).toBeInTheDocument();
  });

  it('configures Clerk appearance with correct styling', () => {
    render(<SignInPage />);

    const appearanceConfig = screen.getByTestId('appearance-config');
    const config = JSON.parse(appearanceConfig.textContent || '{}');

    expect(config.elements).toBeDefined();
    expect(config.elements.formButtonPrimary).toBe('btn-base btn-primary');
    expect(config.elements.socialButtonsBlockButton).toBe(
      'btn-base btn-outline'
    );
    expect(config.elements.formFieldInput).toBe('input-base');

    expect(config.variables).toBeDefined();
    expect(config.variables.colorPrimary).toBe('var(--color-primary)');
    expect(config.variables.colorBackground).toBe('var(--color-background)');
  });
});

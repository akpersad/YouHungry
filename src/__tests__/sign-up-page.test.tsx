import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignUpPage from '@/app/sign-up/[[...rest]]/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  SignUp: ({ appearance, fallbackRedirectUrl, signInUrl }: any) => (
    <div data-testid="clerk-signup">
      <div data-testid="redirect-url">{fallbackRedirectUrl}</div>
      <div data-testid="signin-url">{signInUrl}</div>
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

describe('SignUpPage', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  it('renders the sign-up page with correct title and description', () => {
    render(<SignUpPage />);

    expect(screen.getByText('Join ForkInTheRoad')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create your account to start discovering amazing restaurants'
      )
    ).toBeInTheDocument();
  });

  it('renders the benefits section with app features', () => {
    render(<SignUpPage />);

    expect(screen.getByText("What you'll get:")).toBeInTheDocument();
    expect(
      screen.getByText('Create personal restaurant collections')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Make group decisions with friends')
    ).toBeInTheDocument();
    expect(screen.getByText('Get smart recommendations')).toBeInTheDocument();
    expect(
      screen.getByText('Never argue about where to eat again')
    ).toBeInTheDocument();
  });

  it('renders the Clerk SignUp component with correct configuration', () => {
    render(<SignUpPage />);

    const clerkSignUp = screen.getByTestId('clerk-signup');
    expect(clerkSignUp).toBeInTheDocument();

    expect(screen.getByTestId('redirect-url')).toHaveTextContent('/dashboard');
    expect(screen.getByTestId('signin-url')).toHaveTextContent('/sign-in');
  });

  it('has a back to home button that navigates correctly', () => {
    render(<SignUpPage />);

    const backButton = screen.getByText('← Back to Home');
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('renders SMS benefits information', () => {
    render(<SignUpPage />);

    expect(
      screen.getByText('📱 SMS Notifications (Optional)')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enable SMS to get notified about group decisions/)
    ).toBeInTheDocument();
  });

  it('renders terms and privacy policy text', () => {
    render(<SignUpPage />);

    expect(
      screen.getByText(
        /By creating an account, you agree to our Terms of Service and Privacy Policy/
      )
    ).toBeInTheDocument();
  });

  it('configures Clerk appearance with correct styling', () => {
    render(<SignUpPage />);

    const appearanceConfig = screen.getByTestId('appearance-config');
    const config = JSON.parse(appearanceConfig.textContent || '{}');

    expect(config.elements).toBeDefined();
    expect(config.elements.formButtonPrimary).toBe('btn-base btn-primary');
    expect(config.elements.socialButtonsBlockButton).toBe(
      'btn-base btn-outline'
    );
    expect(config.elements.formFieldInput).toBe('input-base');
    expect(config.elements.formFieldSuccessText).toBe('text-sm text-success');

    expect(config.variables).toBeDefined();
    expect(config.variables.colorPrimary).toBe('var(--color-primary)');
    expect(config.variables.colorBackground).toBe('var(--color-background)');
  });

  it('displays benefits in a visually appealing format', () => {
    render(<SignUpPage />);

    const benefitsList = screen.getByText("What you'll get:").closest('div');
    expect(benefitsList).toHaveClass(
      'bg-surface',
      'rounded-lg',
      'p-4',
      'border',
      'border-border'
    );
  });

  it('displays SMS info in a highlighted format', () => {
    render(<SignUpPage />);

    const smsInfo = screen
      .getByText('📱 SMS Notifications (Optional)')
      .closest('div');
    expect(smsInfo).toHaveClass(
      'bg-primary/10',
      'dark:bg-primary/20/20',
      'rounded-lg',
      'p-4',
      'border',
      'border-primary',
      'dark:border-primary'
    );
  });
});

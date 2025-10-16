import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignUpPage from '@/app/sign-up/[[...rest]]/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
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
  useSignUp: jest.fn(() => ({
    isLoaded: true,
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
    },
    setActive: jest.fn(),
  })),
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

    expect(screen.getByText('Join Fork In The Road')).toBeInTheDocument();
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

  it('renders the custom registration form', () => {
    render(<SignUpPage />);

    // Check for form fields
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
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
      screen.getByText(/By creating an account, you agree to our/)
    ).toBeInTheDocument();
    const privacyLinks = screen.getAllByText(/Privacy Policy & Terms/);
    expect(privacyLinks.length).toBeGreaterThan(0);
  });

  it('renders custom registration form with proper styling', () => {
    render(<SignUpPage />);

    // Check for form container
    const formContainer = screen
      .getByLabelText(/first name/i)
      .closest('.bg-surface');
    expect(formContainer).toHaveClass(
      'bg-surface',
      'rounded-lg',
      'border',
      'border-border'
    );
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
    expect(smsInfo).toHaveClass('rounded-lg', 'p-4', 'border');
  });
});

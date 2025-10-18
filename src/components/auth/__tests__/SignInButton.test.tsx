import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@/components/auth/SignInButton';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Clerk SignInButton
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: any) => (
    <div data-testid="clerk-signin">{children}</div>
  ),
}));

describe('SignInButton (Updated)', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  it('renders with default text', () => {
    render(<SignInButton />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(<SignInButton>Custom Sign In Text</SignInButton>);

    expect(screen.getByText('Custom Sign In Text')).toBeInTheDocument();
  });

  it('applies default styling classes', () => {
    render(<SignInButton />);

    const button = screen.getByText('Sign In');
    expect(button).toHaveClass('btn-base', 'btn-primary', 'btn-md');
  });

  it('applies custom variant styling', () => {
    render(<SignInButton variant="outline" />);

    const button = screen.getByText('Sign In');
    expect(button).toHaveClass('btn-base', 'btn-outline', 'btn-md');
  });

  it('applies custom size styling', () => {
    render(<SignInButton size="lg" />);

    const button = screen.getByText('Sign In');
    expect(button).toHaveClass('btn-base', 'btn-primary', 'btn-lg');
  });

  it('applies custom className', () => {
    render(<SignInButton className="custom-class" />);

    const button = screen.getByText('Sign In');
    expect(button).toHaveClass(
      'btn-base',
      'btn-primary',
      'btn-md',
      'custom-class'
    );
  });

  // TODO: Re-enable when Jest 30 window.location mocking is resolved
  // Jest 30 doesn't allow mocking non-configurable properties like window.location
  it.skip('navigates to /sign-in when clicked', () => {
    // Mock production environment (non-localhost hostname)
    const locationSpy = jest.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'you-hungry.vercel.app',
    } as any);

    render(<SignInButton />);

    const button = screen.getByText('Sign In');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/sign-in');

    locationSpy.mockRestore();
  });

  // TODO: Re-enable when Jest 30 window.location mocking is resolved
  // Jest 30 doesn't allow mocking non-configurable properties like window.location
  it.skip('handles all prop combinations correctly', () => {
    // Mock production environment (non-localhost hostname)
    const locationSpy = jest.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'you-hungry.vercel.app',
    } as any);

    render(
      <SignInButton variant="secondary" size="sm" className="test-class">
        Test Button
      </SignInButton>
    );

    const button = screen.getByText('Test Button');
    expect(button).toHaveClass(
      'btn-base',
      'btn-secondary',
      'btn-sm',
      'test-class'
    );

    fireEvent.click(button);
    expect(mockPush).toHaveBeenCalledWith('/sign-in');

    locationSpy.mockRestore();
  });

  it('is accessible with proper button role', () => {
    render(<SignInButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign In');
  });
});

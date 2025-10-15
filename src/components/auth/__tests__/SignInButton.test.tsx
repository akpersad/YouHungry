import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@/components/auth/SignInButton';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

  it('navigates to /sign-in when clicked', () => {
    // Mock production environment
    Object.defineProperty(window, 'location', {
      value: { hostname: 'you-hungry.vercel.app' },
      writable: true,
    });

    render(<SignInButton />);

    const button = screen.getByText('Sign In');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });

  it('handles all prop combinations correctly', () => {
    // Mock production environment
    Object.defineProperty(window, 'location', {
      value: { hostname: 'you-hungry.vercel.app' },
      writable: true,
    });

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
  });

  it('is accessible with proper button role', () => {
    render(<SignInButton />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign In');
  });
});

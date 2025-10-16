/**
 * AdminGate Component Tests
 *
 * Tests the security gate component that controls access to the admin panel
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AdminGate } from '../AdminGate';

// Mock dependencies
jest.mock('@clerk/nextjs');
jest.mock('next/navigation');
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('should show loading spinner when user is not loaded', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: false,
      isSignedIn: false,
    } as any);

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should redirect to sign-in when user is not authenticated', async () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: true,
      isSignedIn: false,
    });

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sign-in?redirect_url=/admin');
    });

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should show access denied for unauthorized users', async () => {
    const mockUser = {
      id: 'user_unauthorized',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    } as any;

    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
    });

    // Mock API response for unauthorized user
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { _id: 'unauthorized_user_id', isAdmin: false },
      }),
    });

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText("You don't have permission to access this area.")
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should allow access for authorized admin users', async () => {
    const mockUser = {
      id: 'user_admin',
      emailAddresses: [{ emailAddress: 'admin@example.com' }],
    } as any;

    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
    });

    // Mock API response for authorized user
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { _id: '68d9b010a25dec569c34c111', isAdmin: true }, // Server determines admin status
      }),
    });

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const mockUser = {
      id: 'user_test',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    } as any;

    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
    });

    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should handle non-200 API responses', async () => {
    const mockUser = {
      id: 'user_test',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    } as any;

    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
    });

    // Mock non-200 response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should provide go to dashboard button on access denied', async () => {
    const mockUser = {
      id: 'user_unauthorized',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    } as any;

    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { _id: 'unauthorized_user_id' },
      }),
    });

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      const dashboardButton = screen.getByText('Go to Dashboard');
      expect(dashboardButton).toBeInTheDocument();

      dashboardButton.click();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle multiple admin user IDs in allowlist', async () => {
    const mockUser = {
      id: 'user_admin2',
      emailAddresses: [{ emailAddress: 'admin2@example.com' }],
    };

    mockUseUser.mockReturnValue({
      user: mockUser as any,
      isLoaded: true,
      isSignedIn: true,
    });

    // Mock API response for second admin user ID
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { _id: '68d9ae3528a9bab6c334d9f9' }, // Second admin user ID from allowlist
      }),
    });

    render(
      <AdminGate>
        <div>Admin Content</div>
      </AdminGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });
});

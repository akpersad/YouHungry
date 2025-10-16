import { renderHook, waitFor } from '@testing-library/react';
import { useIsAdmin } from '../useIsAdmin';
import { useUser } from '@clerk/nextjs';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

// Mock fetch
global.fetch = jest.fn();

describe('useIsAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should return false when user is not loaded', () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
      isSignedIn: false,
    } as any);

    const { result } = renderHook(() => useIsAdmin());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it('should return false when user is not signed in', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: null,
      isSignedIn: false,
    } as any);

    const { result } = renderHook(() => useIsAdmin());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it('should return true for admin user', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_123' },
      isSignedIn: true,
    } as any);

    // Mock successful admin check
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: '68d9b010a25dec569c34c111',
          isAdmin: true, // Server determines admin status
        },
      }),
    });

    const { result } = renderHook(() => useIsAdmin());

    // Initially checking
    expect(result.current.isChecking).toBe(true);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should return false for non-admin user', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_456' },
      isSignedIn: true,
    } as any);

    // Mock successful non-admin check
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: '507f1f77bcf86cd799439011',
          isAdmin: false, // Server determines admin status
        },
      }),
    });

    const { result } = renderHook(() => useIsAdmin());

    // Initially checking
    expect(result.current.isChecking).toBe(true);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should handle fetch errors gracefully', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_123' },
      isSignedIn: true,
    } as any);

    // Mock fetch error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIsAdmin());

    // Initially checking
    expect(result.current.isChecking).toBe(true);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_123' },
      isSignedIn: true,
    } as any);

    // Mock API error response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useIsAdmin());

    // Initially checking
    expect(result.current.isChecking).toBe(true);

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should handle missing user ID in response', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_123' },
      isSignedIn: true,
    } as any);

    // Mock response with missing user._id
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          // Missing _id
          name: 'Test User',
        },
      }),
    });

    const { result } = renderHook(() => useIsAdmin());

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should check admin status for second admin user', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_789' },
      isSignedIn: true,
    } as any);

    // Mock successful admin check with second admin ID
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: '68d9ae3528a9bab6c334d9f9', // Second admin ID
          isAdmin: true, // Server determines admin status
        },
      }),
    });

    const { result } = renderHook(() => useIsAdmin());

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should re-check when user changes', async () => {
    const { result, rerender } = renderHook(() => useIsAdmin());

    // First render with non-admin
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_456' },
      isSignedIn: true,
    } as any);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: '507f1f77bcf86cd799439011',
        },
      }),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);

    // Change to admin user
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: 'clerk_user_123' },
      isSignedIn: true,
    } as any);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          _id: '68d9b010a25dec569c34c111',
          isAdmin: true, // Server determines admin status
        },
      }),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });
  });
});

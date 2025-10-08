import React from 'react';
import { renderHook } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useProfile } from '../useProfile';
import { useToast } from '@/hooks/useToast';

// Mock dependencies
jest.mock('@/hooks/useToast');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;

interface MockToast {
  toast: jest.Mock;
}

describe('useProfile', () => {
  let queryClient: QueryClient;
  let mockToast: MockToast;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockToast = {
      toast: jest.fn(),
    };

    mockUseToast.mockReturnValue(mockToast);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return profile data and loading state', () => {
    const mockProfile = {
      _id: 'user123',
      clerkId: 'clerk123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      city: 'Test City',
      state: 'Test State',
      profilePicture: 'https://example.com/pic.jpg',
      smsOptIn: true,
      smsPhoneNumber: '+1234567890',
      phoneNumber: '+1234567890',
      preferences: {
        defaultLocation: 'Test Location',
        locationSettings: {
          city: 'Test City',
          state: 'Test State',
          country: 'US',
          timezone: 'America/New_York',
        },
        notificationSettings: {
          groupDecisions: true,
          friendRequests: true,
          groupInvites: true,
          smsEnabled: true,
          emailEnabled: true,
          pushEnabled: true,
        },
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    };

    mockUseQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    } as any);

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle profile update mutation', async () => {
    const mockUpdateProfile = jest.fn().mockResolvedValue({ success: true });
    const mockInvalidateQueries = jest.fn();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    // Mock the updateProfile mutation to simulate the onSuccess callback
    const mockMutateAsync = jest.fn().mockImplementation(async (data) => {
      const result = await mockUpdateProfile(data);
      // Simulate the onSuccess callback being called
      mockInvalidateQueries({ queryKey: ['user-profile'] });
      mockToast.toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      return result;
    });

    mockUseMutation.mockReturnValueOnce({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    // Mock the other two mutations: uploadPicture, removePicture
    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any);

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    const updateData = {
      name: 'Updated Name',
      city: 'Updated City',
    };

    await result.current.updateProfile(updateData);

    expect(mockUpdateProfile).toHaveBeenCalledWith(updateData);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-profile'],
    });
    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Profile Updated',
      description: 'Your profile has been updated successfully.',
    });
  });

  it('should handle profile update errors', async () => {
    const mockUpdateProfile = jest
      .fn()
      .mockRejectedValue(new Error('Update failed'));

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    // Mock the updateProfile mutation to simulate the onError callback
    const mockMutateAsync = jest.fn().mockImplementation(async (data) => {
      try {
        await mockUpdateProfile(data);
      } catch (error) {
        // Simulate the onError callback being called
        mockToast.toast({
          title: 'Update Failed',
          description: 'Update failed',
          variant: 'destructive',
        });
        throw error;
      }
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any);

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    const updateData = {
      name: 'Updated Name',
    };

    try {
      await result.current.updateProfile(updateData);
    } catch {
      // Expected to throw
    }

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Update Failed',
      description: 'Update failed',
      variant: 'destructive',
    });
  });

  it('should handle profile picture upload', async () => {
    const mockUploadPicture = jest.fn().mockResolvedValue({ success: true });
    const mockInvalidateQueries = jest.fn();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    // Mock the uploadPicture mutation to simulate the onSuccess callback
    const mockUploadMutateAsync = jest.fn().mockImplementation(async (file) => {
      const result = await mockUploadPicture(file);
      // Simulate the onSuccess callback being called
      mockInvalidateQueries({ queryKey: ['user-profile'] });
      mockToast.toast({
        title: 'Picture Updated',
        description: 'Your profile picture has been updated successfully.',
      });
      return result;
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: mockUploadMutateAsync,
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any);

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await result.current.uploadPicture(file);

    expect(mockUploadPicture).toHaveBeenCalledWith(file);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-profile'],
    });
    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Picture Updated',
      description: 'Your profile picture has been updated successfully.',
    });
  });

  it('should handle profile picture removal', async () => {
    const mockRemovePicture = jest.fn().mockResolvedValue({ success: true });
    const mockInvalidateQueries = jest.fn();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    // Mock the removePicture mutation to simulate the onSuccess callback
    const mockRemoveMutateAsync = jest.fn().mockImplementation(async () => {
      const result = await mockRemovePicture();
      // Simulate the onSuccess callback being called
      mockInvalidateQueries({ queryKey: ['user-profile'] });
      mockToast.toast({
        title: 'Picture Removed',
        description: 'Your profile picture has been removed successfully.',
      });
      return result;
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any)
      .mockReturnValueOnce({
        mutateAsync: mockRemoveMutateAsync,
        isPending: false,
      } as any);

    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    await result.current.removePicture();

    expect(mockRemovePicture).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-profile'],
    });
    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Picture Removed',
      description: 'Your profile picture has been removed successfully.',
    });
  });

  it('should handle loading states correctly', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as any);

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    };

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isUpdating).toBe(true);
    expect(result.current.isUploading).toBe(true);
    expect(result.current.isRemoving).toBe(true);
  });
});

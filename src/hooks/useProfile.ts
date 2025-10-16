import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';

interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  username?: string;
  city?: string;
  state?: string;
  profilePicture?: string;
  smsOptIn: boolean;
  smsPhoneNumber?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  preferences: {
    defaultLocation?: string;
    locationSettings: {
      city?: string;
      state?: string;
      country?: string;
      timezone?: string;
    };
    notificationSettings: {
      groupDecisions: {
        started: boolean;
        completed: boolean;
      };
      friendRequests: boolean;
      groupInvites: boolean;
      smsEnabled: boolean;
      emailEnabled: boolean;
      pushEnabled: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateData {
  // Note: name is managed by Clerk and should not be updated via this hook
  username?: string;
  city?: string;
  state?: string;
  smsOptIn?: boolean;
  smsPhoneNumber?: string;
  preferences?: {
    defaultLocation?: string;
    locationSettings?: {
      city?: string;
      state?: string;
      country?: string;
      timezone?: string;
    };
    notificationSettings?: {
      groupDecisions?: {
        started?: boolean;
        completed?: boolean;
      };
      friendRequests?: boolean;
      groupInvites?: boolean;
      smsEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
    };
  };
}

export function useProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const profileQuery = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: ProfileUpdateData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Note: Profile picture is managed by Clerk and synced via webhook

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}

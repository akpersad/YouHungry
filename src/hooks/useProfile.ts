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
  name?: string;
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

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/profile/picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload picture');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: 'Picture Updated',
        description: 'Your profile picture has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove profile picture mutation
  const removePictureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/profile/picture', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove picture');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({
        title: 'Picture Removed',
        description: 'Your profile picture has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Remove Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    uploadPicture: uploadPictureMutation.mutateAsync,
    isUploading: uploadPictureMutation.isPending,
    removePicture: removePictureMutation.mutateAsync,
    isRemoving: removePictureMutation.isPending,
  };
}

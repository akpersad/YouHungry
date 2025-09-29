'use client';

import React, { use } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GroupView } from '@/components/features/GroupView';
import { Button } from '@/components/ui/Button';
import {
  useGroup,
  useUpdateGroup,
  useInviteUserToGroup,
  useRemoveUserFromGroup,
  usePromoteToAdmin,
  useLeaveGroup,
  useDeleteGroup,
} from '@/hooks/api/useGroups';
import { toast } from 'react-hot-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupPage({ params }: GroupPageProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const { id: groupId } = use(params);
  const [currentUserMongoId, setCurrentUserMongoId] = useState<string>('');

  // Fetch current user's MongoDB ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/current');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserMongoId(userData.user._id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    if (userId) {
      fetchCurrentUser();
    }
  }, [userId]);

  const { data: groupData, isLoading, error } = useGroup(groupId);
  const updateGroupMutation = useUpdateGroup();
  const inviteUserMutation = useInviteUserToGroup();
  const removeUserMutation = useRemoveUserFromGroup();
  const promoteUserMutation = usePromoteToAdmin();
  const leaveGroupMutation = useLeaveGroup();
  const deleteGroupMutation = useDeleteGroup();

  const handleUpdateGroup = async (data: {
    name?: string;
    description?: string;
  }) => {
    try {
      await updateGroupMutation.mutateAsync({ groupId, data });
      toast.success('Group updated successfully!');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group. Please try again.');
    }
  };

  const handleInviteUser = async (email: string) => {
    try {
      await inviteUserMutation.mutateAsync({ groupId, data: { email } });
      toast.success(`Invitation sent to ${email}!`);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation. Please try again.');
    }
  };

  const handleInviteFriends = async (friendEmails: string[]) => {
    try {
      // Send invitations using friend emails
      const invitePromises = friendEmails.map(async (friendEmail) => {
        await inviteUserMutation.mutateAsync({
          groupId,
          data: { email: friendEmail },
        });
      });

      await Promise.all(invitePromises);
      toast.success(`Invitations sent to ${friendEmails.length} friend(s)!`);
    } catch (error) {
      console.error('Error inviting friends:', error);
      toast.error('Failed to send invitations. Please try again.');
    }
  };

  const handleRemoveUser = async (email: string) => {
    try {
      await removeUserMutation.mutateAsync({ groupId, data: { email } });
      toast.success(`User removed from group`);
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user. Please try again.');
    }
  };

  const handlePromoteUser = async (email: string) => {
    try {
      await promoteUserMutation.mutateAsync({ groupId, data: { email } });
      toast.success(`User promoted to admin`);
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user. Please try again.');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupMutation.mutateAsync(groupId);
      toast.success('You have left the group');
      router.push('/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group. Please try again.');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
      toast.success('Group deleted successfully');
      router.push('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </MainLayout>
    );
  }

  if (error || !groupData) {
    return (
      <MainLayout>
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text mb-4">
                Group Not Found
              </h1>
              <p className="text-text-light mb-4">
                The group you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have access to it.
              </p>
              <Button variant="primary" onClick={() => router.push('/groups')}>
                Back to Groups
              </Button>
            </div>
          </div>
        </ProtectedRoute>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/groups')}
              className="mb-4"
            >
              ← Back to Groups
            </Button>
          </div>

          <GroupView
            group={groupData}
            currentUserId={currentUserMongoId}
            onUpdateGroup={handleUpdateGroup}
            onInviteUser={handleInviteUser}
            onInviteFriends={handleInviteFriends}
            onRemoveUser={handleRemoveUser}
            onPromoteUser={handlePromoteUser}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
            isLoading={
              updateGroupMutation.isPending ||
              inviteUserMutation.isPending ||
              removeUserMutation.isPending ||
              promoteUserMutation.isPending ||
              leaveGroupMutation.isPending ||
              deleteGroupMutation.isPending
            }
          />
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}

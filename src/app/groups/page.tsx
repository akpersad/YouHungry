'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
// import { useRouter } from 'next/navigation';
import { GroupList } from '@/components/features/GroupList';
import { GroupInvitations } from '@/components/features/GroupInvitations';
// import { GroupInvitation } from '@/types/database';

// Define the GroupInvitation type that matches what the API returns
interface GroupInvitation {
  _id: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
}
import { CreateGroupForm } from '@/components/forms/CreateGroupForm';
import { Button } from '@/components/ui/Button';
import {
  useGroups,
  useCreateGroup,
  useGroupInvitations,
  useAcceptGroupInvitation,
  useDeclineGroupInvitation,
} from '@/hooks/api/useGroups';
import { toast } from 'sonner';

export default function GroupsPage() {
  const { userId } = useAuth();
  // const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'invitations'>(
    'groups'
  );

  const { data: groups = [], isLoading, error } = useGroups(userId || '');
  const createGroupMutation = useCreateGroup();

  // Real group invitations data from API
  const { data: groupInvitations = [], isLoading: invitationsLoading } =
    useGroupInvitations(userId || '');
  const acceptInvitationMutation = useAcceptGroupInvitation();
  const declineInvitationMutation = useDeclineGroupInvitation();

  const handleCreateGroup = async (data: {
    name: string;
    description?: string;
    memberEmails?: string[];
  }) => {
    try {
      const groupData = await createGroupMutation.mutateAsync({
        name: data.name,
        description: data.description,
      });

      // If there are member emails, invite them to the group
      if (data.memberEmails && data.memberEmails.length > 0) {
        const invitePromises = data.memberEmails.map((email) =>
          fetch(`/api/groups/${groupData._id}/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })
        );

        await Promise.all(invitePromises);
        toast.success(
          `Group created and ${data.memberEmails.length} invitations sent!`
        );
      } else {
        toast.success('Group created successfully!');
      }
    } catch (error) {
      logger.error('Error creating group:', error);
      toast.error('Failed to create group. Please try again.');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitationMutation.mutateAsync(invitationId);
      toast.success('Successfully joined the group!');
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineInvitationMutation.mutateAsync(invitationId);
      toast.success('Invitation declined');
    } catch (error) {
      logger.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text mb-4">Groups</h1>
          <div className="bg-destructive/10 border border-destructive rounded-md p-4">
            <p className="text-destructive font-medium">
              Failed to load groups. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Groups</h1>
            <p className="mt-2 text-text-light">
              Collaborate with friends on restaurant decisions
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
          >
            Create Group
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'groups'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-light hover:text-text hover:border-border'
              }`}
            >
              My Groups ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-light hover:text-text hover:border-border'
              }`}
            >
              Invitations ({groupInvitations.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'groups' ? (
        <GroupList
          groups={groups}
          isLoading={isLoading}
          onCreateGroup={() => setShowCreateForm(true)}
        />
      ) : (
        <GroupInvitations
          invitations={groupInvitations as GroupInvitation[]}
          onAcceptInvitation={handleAcceptInvitation}
          onDeclineInvitation={handleDeclineInvitation}
          isLoading={invitationsLoading}
        />
      )}

      <CreateGroupForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateGroup}
        isLoading={createGroupMutation.isPending}
      />
    </div>
  );
}

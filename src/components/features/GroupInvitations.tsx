'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { toast } from 'react-hot-toast';

interface GroupInvitation {
  _id: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
}

interface GroupInvitationsProps {
  invitations: GroupInvitation[];
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
  isLoading?: boolean;
}

export function GroupInvitations({
  invitations,
  onAcceptInvitation,
  onDeclineInvitation,
  isLoading = false,
}: GroupInvitationsProps) {
  const [processingInvitations, setProcessingInvitations] = useState<
    Set<string>
  >(new Set());

  const handleAccept = async (invitationId: string) => {
    setProcessingInvitations((prev) => new Set(prev).add(invitationId));
    try {
      await onAcceptInvitation(invitationId);
      toast.success('Successfully joined the group!');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingInvitations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingInvitations((prev) => new Set(prev).add(invitationId));
    try {
      await onDeclineInvitation(invitationId);
      toast.success('Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setProcessingInvitations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading invitations...</p>
        </div>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No pending group invitations</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={invitation._id} className="p-6">
          <div className="flex items-start space-x-4">
            <UserAvatar name={invitation.inviterName} size="md" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {invitation.groupName}
              </h3>
              {invitation.groupDescription && (
                <p className="text-sm text-gray-600 mt-1">
                  {invitation.groupDescription}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Invited by{' '}
                <span className="font-medium">{invitation.inviterName}</span> (
                {invitation.inviterEmail})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(invitation.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDecline(invitation._id)}
                isLoading={processingInvitations.has(invitation._id)}
                disabled={processingInvitations.has(invitation._id)}
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAccept(invitation._id)}
                isLoading={processingInvitations.has(invitation._id)}
                disabled={processingInvitations.has(invitation._id)}
              >
                Accept
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

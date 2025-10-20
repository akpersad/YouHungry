'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { toast } from 'sonner';

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
      logger.error('Error accepting invitation:', error);
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
      logger.error('Error declining invitation:', error);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border mx-auto"></div>
          <p className="mt-2 text-sm text-text-light">Loading invitations...</p>
        </div>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-text-light">No pending group invitations</p>
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
              <h3 className="text-lg font-semibold text-text">
                {invitation.groupName}
              </h3>
              {invitation.groupDescription && (
                <p className="text-sm text-text-light mt-1">
                  {invitation.groupDescription}
                </p>
              )}
              <p className="text-sm text-text-light mt-2">
                Invited by{' '}
                <span className="font-medium">{invitation.inviterName}</span> (
                {invitation.inviterEmail})
              </p>
              <p className="text-xs text-text-light mt-1">
                {new Date(invitation.createdAt).toLocaleDateString()}
              </p>
            </div>
            {/* Desktop: Show buttons directly */}
            <div className="hidden md:flex space-x-2">
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

            {/* Mobile: Show dropdown menu */}
            <div className="flex md:hidden flex-shrink-0">
              <DropdownMenu
                trigger={
                  <button
                    className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                    aria-label="Invitation actions"
                  >
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                }
                align="right"
              >
                <DropdownMenuItem
                  onClick={() => handleAccept(invitation._id)}
                  disabled={processingInvitations.has(invitation._id)}
                >
                  Accept
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDecline(invitation._id)}
                  disabled={processingInvitations.has(invitation._id)}
                  variant="destructive"
                >
                  Decline
                </DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import Link from 'next/link';
import { Group, User } from '@/types/database';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { FriendSelectionModal } from './FriendSelectionModal';
import { useDecisionHistory } from '@/hooks/api/useHistory';
import {
  Clock,
  Users,
  Calendar,
  MoreVertical,
  Edit,
  UserPlus,
  UserMinus,
  Crown,
} from 'lucide-react';

interface GroupViewProps {
  group: Group & { members: User[] };
  currentUserId: string;
  onUpdateGroup?: (data: {
    name?: string;
    description?: string;
  }) => Promise<void>;
  onInviteUser?: (email: string) => Promise<void>;
  onInviteFriends?: (friendEmails: string[]) => Promise<void>;
  onRemoveUser?: (email: string) => Promise<void>;
  onPromoteUser?: (email: string) => Promise<void>;
  onLeaveGroup?: () => Promise<void>;
  onDeleteGroup?: () => Promise<void>;
  isLoading?: boolean;
}

export function GroupView({
  group,
  currentUserId,
  onUpdateGroup,
  onInviteUser,
  onInviteFriends,
  onRemoveUser,
  onPromoteUser,
  onLeaveGroup,
  onDeleteGroup,
  isLoading = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}: GroupViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Fetch recent group decisions for activity feed
  const { data: recentDecisions, isLoading: isLoadingDecisions } =
    useDecisionHistory({
      type: 'group',
      groupId: group._id.toString(),
      limit: 5,
      offset: 0,
    });
  const [editData, setEditData] = useState({
    name: group.name,
    description: group.description || '',
  });
  const [showFriendSelectionModal, setShowFriendSelectionModal] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isCurrentUserAdmin = group.adminIds.some(
    (adminId) => adminId.toString() === currentUserId
  );
  // const currentUserMember = group.members.find(
  //   (member) => member._id.toString() === currentUserId
  // );

  // Check if current user is the last admin
  const isLastAdmin = isCurrentUserAdmin && group.adminIds.length === 1;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateGroup) return;

    setActionLoading('update');
    try {
      await onUpdateGroup({
        name: editData.name.trim(),
        description: editData.description.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      logger.error('Error updating group:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInviteFriends = async (friendEmails: string[]) => {
    setActionLoading('invite-friends');
    try {
      await onInviteFriends?.(friendEmails);
      setShowFriendSelectionModal(false);
    } catch (error) {
      logger.error('Error inviting friends:', error);
      throw error; // Re-throw to let the modal handle the error display
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!onRemoveUser) return;

    setActionLoading(`remove-${email}`);
    try {
      await onRemoveUser(email);
      setMemberToRemove(null);
    } catch (error) {
      logger.error('Error removing user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteUser = async (email: string) => {
    if (!onPromoteUser) return;

    setActionLoading(`promote-${email}`);
    try {
      await onPromoteUser(email);
    } catch (error) {
      logger.error('Error promoting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!onLeaveGroup) return;

    setActionLoading('leave');
    try {
      await onLeaveGroup();
      setShowLeaveConfirm(false);
    } catch (error) {
      logger.error('Error leaving group:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!onDeleteGroup) return;

    setActionLoading('delete');
    try {
      await onDeleteGroup();
    } catch (error) {
      logger.error('Error deleting group:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Group Header */}
      <Card className="p-6 !mb-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Group name"
                    required
                  />
                </div>
                <div>
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Group description"
                    rows={3}
                    className="w-full px-3 py-2 border border-border-strong rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-tomato focus:border-tomato"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={actionLoading === 'update'}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        name: group.name,
                        description: group.description || '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-ink mb-2">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-ink-secondary mb-4">{group.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-ink-muted">
                  <span>
                    {group.memberIds.length} member
                    {group.memberIds.length !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>
                    {group.collectionIds?.length || 0} collection
                    {(group.collectionIds?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isEditing && isCurrentUserAdmin && (
            <DropdownMenu
              trigger={
                <button
                  className="p-2 rounded-lg bg-surface hover:bg-surface-sunken transition-colors duration-200"
                  aria-label="Group options"
                >
                  <MoreVertical className="w-5 h-5 text-ink" />
                </button>
              }
            >
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
                Edit Group
              </DropdownMenuItem>
            </DropdownMenu>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Link href={`/groups/${group._id}/collections`} className="flex-1">
            <Button variant="primary" className="w-full">
              View Collections
            </Button>
          </Link>

          {!isLastAdmin ? (
            <Button
              variant="secondary"
              onClick={() => setShowLeaveConfirm(true)}
              isLoading={actionLoading === 'leave'}
              className="flex-1 sm:flex-none"
            >
              Leave Group
            </Button>
          ) : (
            <div className="flex flex-col items-center sm:items-end flex-1 sm:flex-none">
              <Button
                variant="secondary"
                disabled
                className="opacity-50 cursor-not-allowed w-full sm:w-auto"
              >
                Leave Group
              </Button>
              <span className="text-xs text-ink-muted mt-1">
                Cannot leave as the only admin
              </span>
            </div>
          )}

          {isCurrentUserAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              isLoading={actionLoading === 'delete'}
              className="flex-1 sm:flex-none"
            >
              Delete Group
            </Button>
          )}
        </div>
      </Card>

      {/* Members Section */}
      <Card className="p-6 !mb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">Members</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowFriendSelectionModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
        </div>

        <div className="space-y-4">
          {group.members.map((member) => {
            const isAdmin = group.adminIds.some(
              (adminId) => adminId.toString() === member._id.toString()
            );
            const isCurrentUser = member._id.toString() === currentUserId;

            return (
              <div
                key={member._id.toString()}
                className="flex items-center justify-between p-4 bg-surface rounded-lg"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <UserAvatar
                    name={member.name}
                    profilePicture={member.profilePicture}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-ink truncate">
                        {member.name}
                      </span>
                      {isAdmin && (
                        <Badge variant="default" className="flex-shrink-0">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-ink-muted truncate">
                      {member.email}
                    </p>
                  </div>
                </div>

                {isCurrentUserAdmin && !isCurrentUser && (
                  <DropdownMenu
                    trigger={
                      <button
                        className="p-2 rounded-lg bg-surface hover:bg-surface-sunken transition-colors duration-200 flex-shrink-0"
                        aria-label={`Manage ${member.name}`}
                      >
                        <MoreVertical className="w-4 h-4 text-ink" />
                      </button>
                    }
                  >
                    {!isAdmin && (
                      <DropdownMenuItem
                        onClick={() => handlePromoteUser(member.email)}
                      >
                        <Crown className="w-4 h-4" />
                        Promote to Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        setMemberToRemove({
                          name: member.name,
                          email: member.email,
                        })
                      }
                      variant="destructive"
                    >
                      <UserMinus className="w-4 h-4" />
                      Remove from Group
                    </DropdownMenuItem>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest group restaurant decisions and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDecisions ? (
            <p className="text-ink-muted text-center py-8">
              Loading recent activity...
            </p>
          ) : !recentDecisions?.decisions ||
            recentDecisions.decisions.length === 0 ? (
            <p className="text-ink-muted text-center py-8">
              No recent activity yet. Start by creating your first collection!
            </p>
          ) : (
            <div className="space-y-4">
              {recentDecisions.decisions.map((decision, index) => (
                <div
                  key={decision.id || `decision-${index}`}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-ink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-ink">
                        {decision.result?.restaurant?.name ||
                          'Restaurant Decision'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-sunken text-ink">
                        {decision.method}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ink-secondary">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Visited:{' '}
                        {new Date(decision.visitDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Logged:{' '}
                        {new Date(decision.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-ink-muted mt-1">
                      Group Decision • {decision.collectionName}
                    </div>
                  </div>
                </div>
              ))}
              {recentDecisions.pagination.hasMore && (
                <div className="text-center pt-4">
                  <Link href="/history">
                    <Button variant="outline" size="sm">
                      View All History
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Group"
      >
        <div className="space-y-4">
          <p className="text-ink-secondary">
            Are you sure you want to delete &quot;{group.name}&quot;? This
            action cannot be undone. All group collections and data will be
            permanently removed.
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteGroup}
              isLoading={actionLoading === 'delete'}
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Group Confirmation */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveGroup}
        title="Leave Group"
        message={`Are you sure you want to leave "${group.name}"? You'll need a new invitation to rejoin.`}
        confirmLabel="Leave Group"
        isLoading={actionLoading === 'leave'}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove) {
            void handleRemoveUser(memberToRemove.email);
          }
        }}
        title="Remove Member"
        message={`Remove ${memberToRemove?.name ?? 'this member'} from "${group.name}"? They'll need a new invitation to rejoin.`}
        confirmLabel="Remove"
        isLoading={actionLoading === `remove-${memberToRemove?.email}`}
      />

      {/* Friend Selection Modal */}
      <FriendSelectionModal
        isOpen={showFriendSelectionModal}
        onClose={() => setShowFriendSelectionModal(false)}
        onInviteFriends={handleInviteFriends}
        onInviteByEmail={onInviteUser}
        groupId={group._id.toString()}
        isLoading={actionLoading === 'invite-friends'}
      />

      {/* Mobile Spacer - prevents content from being cut off by bottom navigation */}
      <div className="h-32 md:hidden" aria-hidden="true" />
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Group, User } from '@/types/database';

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (userId: string) => [...groupKeys.lists(), userId] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: (id: string) => [...groupKeys.detail(id), 'members'] as const,
};

// Types for API responses
interface GroupsResponse {
  groups: Group[];
}

interface GroupResponse {
  group: Group & { members: User[] };
}

// interface GroupMembersResponse {
//   group: Group;
//   members: User[];
// }

interface CreateGroupRequest {
  name: string;
  description?: string;
}

interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

interface InviteUserRequest {
  email: string;
}

interface PromoteUserRequest {
  email: string;
}

interface RemoveUserRequest {
  email: string;
}

// Fetch groups for a user
async function fetchGroups(_userId: string): Promise<Group[]> {
  const response = await fetch('/api/groups');
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  const data: GroupsResponse = await response.json();
  return data.groups;
}

// Fetch a single group with members
async function fetchGroup(
  groupId: string
): Promise<Group & { members: User[] }> {
  const response = await fetch(`/api/groups/${groupId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch group');
  }
  const data: GroupResponse = await response.json();
  return data.group;
}

// Create a new group
async function createGroup(data: CreateGroupRequest): Promise<Group> {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create group');
  }

  const result: GroupResponse = await response.json();
  return result.group;
}

// Update a group
async function updateGroup(
  groupId: string,
  data: UpdateGroupRequest
): Promise<Group> {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update group');
  }

  const result: GroupResponse = await response.json();
  return result.group;
}

// Delete a group
async function deleteGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete group');
  }
}

// Invite user to group
async function inviteUserToGroup(
  groupId: string,
  data: InviteUserRequest
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite user to group');
  }
}

// Remove user from group
async function removeUserFromGroup(
  groupId: string,
  data: RemoveUserRequest
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove user from group');
  }
}

// Promote user to admin
async function promoteToAdmin(
  groupId: string,
  data: PromoteUserRequest
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/promote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to promote user to admin');
  }
}

// Leave group
async function leaveGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/leave`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave group');
  }
}

// Hooks
export function useGroups(userId: string) {
  return useQuery({
    queryKey: groupKeys.list(userId),
    queryFn: () => fetchGroups(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => fetchGroup(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup) => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });

      // Add the new group to the cache
      queryClient.setQueryData(groupKeys.detail(newGroup._id.toString()), {
        group: { ...newGroup, members: [] },
      });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: UpdateGroupRequest;
    }) => updateGroup(groupId, data),
    onSuccess: (updatedGroup, { groupId }) => {
      // Update the group in cache
      queryClient.setQueryData(groupKeys.detail(groupId), {
        group: { ...updatedGroup, members: [] },
      });

      // Invalidate groups list to ensure consistency
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_, groupId) => {
      // Remove the group from cache
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });

      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

export function useInviteUserToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: InviteUserRequest;
    }) => inviteUserToGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      // Invalidate group details to refresh members list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

export function useRemoveUserFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: RemoveUserRequest;
    }) => removeUserFromGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      // Invalidate group details to refresh members list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

export function usePromoteToAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: PromoteUserRequest;
    }) => promoteToAdmin(groupId, data),
    onSuccess: (_, { groupId }) => {
      // Invalidate group details to refresh members list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: (_, groupId) => {
      // Remove the group from cache
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });

      // Invalidate groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Group Invitations
async function getGroupInvitations(): Promise<unknown[]> {
  const response = await fetch('/api/groups/invitations');
  if (!response.ok) {
    throw new Error('Failed to fetch group invitations');
  }
  const data = await response.json();
  return data.invitations;
}

async function acceptGroupInvitation(invitationId: string): Promise<void> {
  const response = await fetch(
    `/api/groups/invitations/${invitationId}/accept`,
    {
      method: 'POST',
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to accept invitation');
  }
}

async function declineGroupInvitation(invitationId: string): Promise<void> {
  const response = await fetch(
    `/api/groups/invitations/${invitationId}/decline`,
    {
      method: 'POST',
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to decline invitation');
  }
}

export function useGroupInvitations(userId?: string) {
  return useQuery({
    queryKey: ['groupInvitations', userId],
    queryFn: getGroupInvitations,
    enabled: !!userId,
  });
}

export function useAcceptGroupInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => acceptGroupInvitation(invitationId),
    onSuccess: () => {
      // Invalidate group invitations and groups list
      queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useDeclineGroupInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => declineGroupInvitation(invitationId),
    onSuccess: () => {
      // Invalidate group invitations
      queryClient.invalidateQueries({ queryKey: ['groupInvitations'] });
    },
  });
}

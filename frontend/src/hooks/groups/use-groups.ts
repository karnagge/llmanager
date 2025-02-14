import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GroupService,
  type Group,
  type CreateGroupDto,
  type UpdateGroupDto,
  type GroupMember,
  type AddMemberDto,
  type GroupPermission,
} from "@/services/group-service";

// Query keys
const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...groupKeys.lists(), { filters }] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: (id: string) => [...groupKeys.detail(id), "members"] as const,
  permissions: (id: string) => [...groupKeys.detail(id), "permissions"] as const,
  history: (id: string) => [...groupKeys.detail(id), "history"] as const,
};

// Hook for fetching all groups
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: () => GroupService.getGroups(),
  });
}

// Hook for fetching a single group
export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => GroupService.getGroup(id),
    enabled: Boolean(id),
  });
}

// Hook for creating a group
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupDto) => GroupService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Hook for updating a group
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDto }) =>
      GroupService.updateGroup(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Hook for deleting a group
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GroupService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

// Hook for fetching group members
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => GroupService.getGroupMembers(groupId),
    enabled: Boolean(groupId),
  });
}

// Hook for adding a member to a group
export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: AddMemberDto }) =>
      GroupService.addGroupMember(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

// Hook for removing a member from a group
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      GroupService.removeGroupMember(groupId, userId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

// Hook for updating a member's role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId, role }: { groupId: string; userId: string; role: "admin" | "member" }) =>
      GroupService.updateMemberRole(groupId, userId, role),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
}

// Hook for fetching group permissions
export function useGroupPermissions(groupId: string) {
  return useQuery({
    queryKey: groupKeys.permissions(groupId),
    queryFn: () => GroupService.getGroupPermissions(groupId),
    enabled: Boolean(groupId),
  });
}

// Hook for updating group permissions
export function useUpdateGroupPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      permissions,
    }: {
      groupId: string;
      permissions: Array<{ resource: string; action: "read" | "write" | "delete" | "manage" }>;
    }) => GroupService.updateGroupPermissions(groupId, permissions),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.permissions(groupId) });
    },
  });
}

// Hook for fetching group history
export function useGroupHistory(groupId: string) {
  return useQuery({
    queryKey: groupKeys.history(groupId),
    queryFn: () => GroupService.getGroupHistory(groupId),
    enabled: Boolean(groupId),
  });
}
import { api } from "@/lib/api";

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: "admin" | "member";
  addedAt: string;
  addedBy: string;
}

export interface GroupPermission {
  id: string;
  groupId: string;
  resource: string;
  action: "read" | "write" | "delete" | "manage";
  createdAt: string;
  createdBy: string;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
}

export interface AddMemberDto {
  userId: string;
  role: "admin" | "member";
}

export interface GroupChangeLog {
  id: string;
  groupId: string;
  action: "created" | "updated" | "deleted" | "member_added" | "member_removed" | "permission_changed";
  details: Record<string, any>;
  performedBy: string;
  performedAt: string;
}

export class GroupService {
  private static readonly basePath = "/api/groups";

  /**
   * Get all groups
   */
  static async getGroups(): Promise<Group[]> {
    const response = await api.get<Group[]>(this.basePath);
    return response.data;
  }

  /**
   * Get a single group by ID
   */
  static async getGroup(id: string): Promise<Group> {
    const response = await api.get<Group>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupDto): Promise<Group> {
    const response = await api.post<Group>(this.basePath, data);
    return response.data;
  }

  /**
   * Update a group
   */
  static async updateGroup(id: string, data: UpdateGroupDto): Promise<Group> {
    const response = await api.patch<Group>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a group
   */
  static async deleteGroup(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get group members
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const response = await api.get<GroupMember[]>(`${this.basePath}/${groupId}/members`);
    return response.data;
  }

  /**
   * Add member to group
   */
  static async addGroupMember(groupId: string, data: AddMemberDto): Promise<GroupMember> {
    const response = await api.post<GroupMember>(`${this.basePath}/${groupId}/members`, data);
    return response.data;
  }

  /**
   * Remove member from group
   */
  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`${this.basePath}/${groupId}/members/${userId}`);
  }

  /**
   * Update member role
   */
  static async updateMemberRole(groupId: string, userId: string, role: "admin" | "member"): Promise<GroupMember> {
    const response = await api.patch<GroupMember>(`${this.basePath}/${groupId}/members/${userId}`, { role });
    return response.data;
  }

  /**
   * Get group permissions
   */
  static async getGroupPermissions(groupId: string): Promise<GroupPermission[]> {
    const response = await api.get<GroupPermission[]>(`${this.basePath}/${groupId}/permissions`);
    return response.data;
  }

  /**
   * Update group permissions
   */
  static async updateGroupPermissions(
    groupId: string,
    permissions: Array<{ resource: string; action: "read" | "write" | "delete" | "manage" }>
  ): Promise<GroupPermission[]> {
    const response = await api.put<GroupPermission[]>(`${this.basePath}/${groupId}/permissions`, { permissions });
    return response.data;
  }

  /**
   * Get group change history
   */
  static async getGroupHistory(groupId: string): Promise<GroupChangeLog[]> {
    const response = await api.get<GroupChangeLog[]>(`${this.basePath}/${groupId}/history`);
    return response.data;
  }
}
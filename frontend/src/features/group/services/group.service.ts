import axiosInstance from '../../../services/axiosInstance';
import type { ApiResponse } from '../../../types';

// ============================================================
// Types
// ============================================================
export type GroupVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE';
export type GroupRole = 'OWNER' | 'MEMBER' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  visibility: GroupVisibility;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupWithRole extends GroupData {
  myRole: GroupRole;
}

export interface MemberData {
  id: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface JoinRequestData {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  status: InvitationStatus;
  createdAt: string;
}

export interface InvitationData {
  id: string;
  group: GroupData;
  invitedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  status: InvitationStatus;
  createdAt: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  visibility?: GroupVisibility;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  visibility?: GroupVisibility;
}

// ============================================================
// Group CRUD
// ============================================================

/** POST /groups — Tạo nhóm mới */
export const createGroupApi = (data: CreateGroupPayload) =>
  axiosInstance.post<ApiResponse<GroupData>>('/groups', data);

/** GET /groups/list — Danh sách nhóm đã tham gia (có thể filter theo keyword) */
export const getMyGroupsApi = (keyword?: string) =>
  axiosInstance.get<ApiResponse<GroupWithRole[]>>('/groups/list', {
    params: keyword ? { keyword } : undefined,
  });

/** GET /groups/search — Tìm kiếm nhóm công khai */
export const searchGroupsApi = (keyword: string) =>
  axiosInstance.get<ApiResponse<GroupData[]>>('/groups/search', {
    params: { keyword },
  });

/** GET /groups/:groupId — Thông tin chi tiết nhóm */
export const getGroupInfoApi = (groupId: string) =>
  axiosInstance.get<ApiResponse<GroupWithRole>>(`/groups/${groupId}`);

/** PATCH /groups/:groupId — Cập nhật thông tin nhóm */
export const updateGroupApi = (groupId: string, data: UpdateGroupPayload) =>
  axiosInstance.patch<ApiResponse<GroupData>>(`/groups/${groupId}`, data);

/** DELETE /groups/:groupId — Xóa nhóm */
export const deleteGroupApi = (groupId: string) =>
  axiosInstance.delete<ApiResponse<null>>(`/groups/${groupId}`);

// ============================================================
// Members
// ============================================================

/** GET /groups/:groupId/members — Danh sách thành viên */
export const getGroupMembersApi = (groupId: string) =>
  axiosInstance.get<ApiResponse<MemberData[]>>(`/groups/${groupId}/members`);

/** POST /groups/:groupId/members — Thêm thành viên trực tiếp (owner only) */
export const addMemberApi = (groupId: string, userId: string) =>
  axiosInstance.post<ApiResponse<MemberData>>(`/groups/${groupId}/members`, { userId });

/** DELETE /groups/:groupId/members/:userId — Xóa thành viên khỏi nhóm */
export const removeMemberApi = (groupId: string, userId: string) =>
  axiosInstance.delete<ApiResponse<null>>(`/groups/${groupId}/members/${userId}`);

/** PATCH /groups/:groupId/members/:userId/role — Đổi vai trò thành viên */
export const changeRoleApi = (groupId: string, userId: string, role: GroupRole) =>
  axiosInstance.patch<ApiResponse<MemberData>>(
    `/groups/${groupId}/members/${userId}/role`,
    { role }
  );

/** POST /groups/:groupId/leave — Rời nhóm */
export const leaveGroupApi = (groupId: string) =>
  axiosInstance.post<ApiResponse<null>>(`/groups/${groupId}/leave`);

// ============================================================
// Join Requests (xin tham gia)
// ============================================================

/** POST /groups/:groupId/join-request — Gửi yêu cầu tham gia nhóm */
export const joinRequestApi = (groupId: string) =>
  axiosInstance.post<ApiResponse<JoinRequestData>>(`/groups/${groupId}/join-request`);

/** GET /groups/:groupId/join-requests — Danh sách yêu cầu tham gia (owner only) */
export const getJoinRequestsApi = (groupId: string) =>
  axiosInstance.get<ApiResponse<JoinRequestData[]>>(`/groups/${groupId}/join-requests`);

/** PATCH /groups/:groupId/join-requests/:invitationId/accept — Chấp nhận yêu cầu */
export const acceptJoinRequestApi = (groupId: string, invitationId: string) =>
  axiosInstance.patch<ApiResponse<null>>(
    `/groups/${groupId}/join-requests/${invitationId}/accept`
  );

/** PATCH /groups/:groupId/join-requests/:invitationId/reject — Từ chối yêu cầu */
export const rejectJoinRequestApi = (groupId: string, invitationId: string) =>
  axiosInstance.patch<ApiResponse<null>>(
    `/groups/${groupId}/join-requests/${invitationId}/reject`
  );

// ============================================================
// Invitations (mời thành viên)
// ============================================================

/** POST /groups/:groupId/invitations — Mời thành viên qua userId */
export const inviteMemberApi = (groupId: string, userId: string) =>
  axiosInstance.post<ApiResponse<null>>(`/groups/${groupId}/invitations`, { userId });

/** GET /groups/invitations/received — Lời mời nhận được */
export const getReceivedInvitationsApi = () =>
  axiosInstance.get<ApiResponse<InvitationData[]>>('/groups/invitations/received');

/** PATCH /groups/invitations/:invitationId/accept — Chấp nhận lời mời */
export const acceptInvitationApi = (invitationId: string) =>
  axiosInstance.patch<ApiResponse<null>>(
    `/groups/invitations/${invitationId}/accept`
  );

/** PATCH /groups/invitations/:invitationId/reject — Từ chối lời mời */
export const rejectInvitationApi = (invitationId: string) =>
  axiosInstance.patch<ApiResponse<null>>(
    `/groups/invitations/${invitationId}/reject`
  );

// ============================================================
// Transfer Owner
// ============================================================

/** PATCH /groups/:groupId/transfer-owner — Chuyển quyền chủ nhóm */
export const transferOwnerApi = (groupId: string, newOwnerId: string) =>
  axiosInstance.patch<ApiResponse<null>>(`/groups/${groupId}/transfer-owner`, {
    newOwnerId,
  });

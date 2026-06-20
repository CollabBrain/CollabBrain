import { GroupRole } from "@prisma/client";
import { findUserById } from "../../repositories/client/user.repo";
import {
  addMemberGroup,
  changeOwner,
  changeRoleMember,
  createGroup,
  createMemberAndChangeStatus,
  findGroupById,
  findGroupByKeyword,
  findGroupMember,
  findInvitationByGroupAndUser,
  findInvitationById,
  getGroupMembers,
  getInvitationByStatusAndType,
  getListInviteReceived,
  getMyListGroup,
  isGroupOwner,
  removeGroupMember,
  softDeleteGroup,
  updateGroupInfo,
  updateStatusInvitation,
  upsertInvitation,
  findRequestPendingInvitation,
} from "../../repositories/client/group.repo";
import { groupTypeData } from "../../types/client/group.types";

export const creatGroupPostService = async (data: groupTypeData, ownerId: string) => {
  const result = await createGroup(data, ownerId);
  return {
    data: result,
    message: "Tao group thanh cong",
  };
};

export const myGroupGetService = async (myId: string, keyword?: string) => {
  const result = await getMyListGroup(myId, keyword);
  const formatted = result.map((g: any) => ({
    ...g,
    myRole: g.members?.[0]?.role,
    memberCount: g._count?.members || 0,
    members: undefined,
    _count: undefined
  }));
  return {
    data: formatted,
    message: "Thanh cong lay danh sach",
  };
};

export const findGroupGetService = async (keyword: string) => {
  const result = await findGroupByKeyword(keyword);
  const formatted = result.map((g: any) => ({
    ...g,
    memberCount: g._count?.members || 0,
    _count: undefined
  }));
  return {
    data: formatted,
    message: "Tim kiem thanh cong",
  };
};

export const groupInfoGetService = async (groupId: string, myId: string) => {
  const group: any = await findGroupById(groupId, myId);
  if (!group) throw new Error("Nhóm không tồn tại");
  if (group.visibility === "PRIVATE") {
    // Trả về thông tin cơ bản cho frontend xử lý ẩn nội dung, không throw error
  }
  
  let myRole = group.members?.[0]?.role;
  if (!myRole) {
    const pendingReq = await findRequestPendingInvitation(groupId, myId);
    if (pendingReq) {
      myRole = "PENDING";
    }
  }

  const formatted = {
    ...group,
    myRole,
    memberCount: group._count?.members || 0,
    members: undefined,
    _count: undefined
  };

  return { data: formatted, message: "Thong tin group" };
};

export const memberGroupGetService = async (groupId: string, myId: string) => {
  const isMember = await findGroupMember(groupId, myId);
  if (!isMember) {
    throw new Error("Không phải là thành viên nhóm, không thể xem");
  }
  const result = await getGroupMembers(groupId);
  return {
    data: result,
    message: "Lay danh sach thanh vien thanh cong",
  };
};

export const addMemberPostService = async (groupId: string, myId: string, userId: string) => {
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Không phải là chủ nhóm, không thể thêm");
  }
  const existed = await findGroupMember(groupId, userId);
  if (existed) {
    throw new Error("Người dùng đã ở trong nhóm");
  }
  const result = await addMemberGroup(groupId, userId, "MEMBER");
  return {
    data: result,
    message: "Them thanh vien thanh cong",
  };
};

export const deleteMemberDeleteService = async (groupId: string, myId: string, userId: string) => {
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Không phải là chủ nhóm, không thể xóa");
  }
  const target = await findGroupMember(groupId, userId);
  if (!target) {
    throw new Error("Người dùng không ở trong nhóm, không thể xóa");
  }
  if (target.role === "OWNER") {
    throw new Error("Không thể xóa chủ nhóm");
  }
  const result = await removeGroupMember(groupId, userId);
  return {
    data: result,
    message: "Xoa thanh cong",
  };
};

export const leaveGroupPostService = async (groupId: string, myId: string) => {
  const target = await findGroupMember(groupId, myId);
  if (!target) {
    throw new Error("Không phải là thành viên nhóm, không thể rời");
  }
  if (target.role === "OWNER") {
    throw new Error("Chủ nhóm không thể rời");
  }
  const result = await removeGroupMember(groupId, myId);
  return {
    data: result,
    message: "Roi group thanh cong",
  };
};

export const updateGroupPatchService = async (groupId: string, data: groupTypeData, myId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Nhóm không tồn tại");
  }
  const target = await findGroupMember(groupId, myId);
  if (!target) {
    throw new Error("Không phải là thành viên nhóm, không thể cập nhật thông tin");
  }
  if (target.role !== "OWNER") {
    throw new Error("Chỉ chủ nhóm mới có thể cập nhật thông tin nhóm");
  }
  const result = await updateGroupInfo(data, groupId);
  return {
    data: result,
    message: "Cap nhat thanh cong",
  };
};

export const removeGroupDeleteService = async (groupId: string, myId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Nhóm không tồn tại");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Bạn không phải là chủ nhóm");
  }
  const result = await softDeleteGroup(groupId);
  return {
    data: result,
    message: "Xoa thanh cong",
  };
};

export const changeRoleUserPatchService = async (groupId: string, myId: string, userId: string, role: GroupRole) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Nhóm không tồn tại");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Không phải là chủ nhóm");
  }
  const existed = await findGroupMember(groupId, userId);
  if (!existed) {
    throw new Error("Không phải là thành viên nhóm");
  }
  if (existed.role === "OWNER") {
    throw new Error("Không thể thay đổi vai trò của chủ nhóm bằng API này");
  }
  const allowedRoles: GroupRole[] = ["MEMBER", "VIEWER"];
  if (!allowedRoles.includes(role)) {
    throw new Error("Vai trò không hợp lệ");
  }
  const result = await changeRoleMember(groupId, userId, role);
  return {
    data: result,
    message: "Doi role thanh cong",
  };
};

export const joinRequestPostService = async (groupId: string, myId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Không tồn tại nhóm");
  }
  if (group.visibility === "INVITE") {
    throw new Error("Nhóm này không cho phép gửi yêu cầu tham gia");
  }
  const isMember = await findGroupMember(groupId, myId);
  if (isMember) {
    throw new Error("Bạn đã là thành viên nhóm");
  }
  const pending = await findInvitationByGroupAndUser(groupId, myId);
  if (pending?.status === "PENDING") {
    throw new Error("Bạn đã gửi yêu cầu tham gia nhóm rồi");
  }

  // PUBLIC and PRIVATE both create PENDING request
  const result = await upsertInvitation(groupId, myId, undefined, "REQUEST", "PENDING");
  return {
    data: result,
    message: "Gui yeu cau thanh cong",
  };
};

export const listRequestGetService = async (groupId: string, myId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Không tồn tại nhóm");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Bạn không phải là chủ nhóm");
  }
  const result = await getInvitationByStatusAndType(groupId);
  return {
    data: result,
    message: "Danh sach yeu cau",
  };
};

export const acceptMemberPatchService = async (groupId: string, myId: string, invitationId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Không tồn tại nhóm");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Bạn không phải là chủ nhóm");
  }
  const invite = await findInvitationById(invitationId);
  if (!invite || invite.groupId !== groupId) {
    throw new Error("Lời mời hoặc yêu cầu không tồn tại");
  }
  if (invite.type !== "REQUEST") {
    throw new Error("Không phải yêu cầu tham gia nhóm");
  }
  if (invite.status !== "PENDING") {
    throw new Error("Không thể chấp nhận khi trạng thái không phải là đang chờ");
  }
  const existed = await findGroupMember(groupId, invite.userId);
  if (existed) {
    throw new Error("Đã là thành viên, không thể thực hiện");
  }
  const result = await createMemberAndChangeStatus(groupId, invite.userId, invitationId);
  return {
    data: result,
    message: "Chap nhan request thanh cong",
  };
};

export const rejectMemberPatchService = async (groupId: string, myId: string, invitationId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Không tồn tại nhóm");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Bạn không phải là chủ nhóm");
  }
  const invite = await findInvitationById(invitationId);
  if (!invite || invite.groupId !== groupId) {
    throw new Error("Lời mời hoặc yêu cầu không tồn tại");
  }
  if (invite.type !== "REQUEST") {
    throw new Error("Không phải yêu cầu tham gia nhóm");
  }
  if (invite.status !== "PENDING") {
    throw new Error("Không thể từ chối khi trạng thái không phải là đang chờ");
  }
  const result = await updateStatusInvitation(groupId, invitationId, "REJECTED");
  return {
    data: result,
    message: "Tu choi request thanh cong",
  };
};

export const inviteMemberPostService = async (groupId: string, userId: string, myId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Không tồn tại nhóm");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Bạn không phải là chủ nhóm");
  }
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }
  if (userId === myId) {
    throw new Error("Không thể tự mời chính bản thân mình");
  }
  const isMember = await findGroupMember(groupId, userId);
  if (isMember) {
    throw new Error("Đã là thành viên, không thể mời");
  }
  const isInvitation = await findInvitationByGroupAndUser(groupId, userId);
  if (isInvitation?.status === "PENDING") {
    throw new Error("Không thể thực hiện thao tác");
  }
  const result = await upsertInvitation(groupId, userId, myId, "INVITE", "PENDING");
  return {
    data: result,
    message: "Da gui loi moi",
  };
};

export const listInvitationGetService = async (userId: string) => {
  const result = await getListInviteReceived(userId);
  return {
    data: result,
    message: "Lay thanh cong danh sach",
  };
};

export const acceptInvitationPatchService = async (invitationId: string, myId: string) => {
  const invite = await findInvitationById(invitationId);
  if (!invite) {
    throw new Error("Lời mời không tồn tại");
  }
  if (invite.userId !== myId) {
    throw new Error("Thông tin không khớp, vui lòng thử lại");
  }
  if (invite.type !== "INVITE") {
    throw new Error("Không phải lời mời, không thể chấp nhận");
  }
  if (invite.status !== "PENDING") {
    throw new Error("Không thể thực hiện thao tác khi trạng thái không phải là đang chờ");
  }
  const isMember = await findGroupMember(invite.groupId, myId);
  if (isMember) {
    throw new Error("Đã là thành viên, không thể chấp nhận lời mời");
  }
  const result = await createMemberAndChangeStatus(invite.groupId, myId, invitationId);
  return {
    data: result,
    message: "Chap nhan loi moi thanh cong",
  };
};

export const rejectInvitationPatchService = async (invitationId: string, myId: string) => {
  const invite = await findInvitationById(invitationId);
  if (!invite) {
    throw new Error("Lời mời không tồn tại");
  }
  if (invite.userId !== myId) {
    throw new Error("Thông tin không khớp, vui lòng thử lại");
  }
  if (invite.type !== "INVITE") {
    throw new Error("Không phải lời mời, không thể từ chối");
  }
  if (invite.status !== "PENDING") {
    throw new Error("Không thể thực hiện thao tác khi trạng thái không phải là đang chờ");
  }
  const isMember = await findGroupMember(invite.groupId, myId);
  if (isMember) {
    throw new Error("Đã là thành viên, không thể từ chối lời mời");
  }
  const result = await updateStatusInvitation(invite.groupId, invitationId, "REJECTED");
  return {
    data: result,
    message: "Tu choi thanh cong",
  };
};

export const transferOwnerPatchService = async (groupId: string, myId: string, newOwnerId: string) => {
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Không tồn tại nhóm");
  }
  const isOwner = await isGroupOwner(myId, groupId);
  if (!isOwner) {
    throw new Error("Bạn không phải là chủ nhóm");
  }
  if (myId === newOwnerId) {
    throw new Error("Bạn không thể chuyển quyền chủ nhóm cho chính mình");
  }
  const target = await findGroupMember(groupId, newOwnerId);
  if (!target) {
    throw new Error("Không thể chuyển quyền chủ nhóm cho người ngoài nhóm");
  }
  const result = await changeOwner(groupId, myId, newOwnerId);
  return {
    data: result,
    message: "Chuyen owner thanh cong",
  };
};

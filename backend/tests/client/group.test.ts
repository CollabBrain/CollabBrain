import { describe, it, expect } from 'vitest';
import {
  findGroupByKeyword,
  createGroup,
  getMyListGroup,
  findGroupById,
  findGroupMember,
  isGroupOwner,
  getGroupMembers,
  addMemberGroup,
  removeGroupMember,
  updateGroupInfo,
  softDeleteGroup,
  changeRoleMember,
  findRequestPendingInvitation,
  findInvitationByGroupAndUser,
  createInvitation,
  getInvitationByStatusAndType,
  updateStatusInvitation,
} from '../../repositories/client/group.repo';
import { prismaMock } from '../setup';
import { GroupRole, GroupVisibility, InvitationType, InvitationStatus } from '@prisma/client';

describe('group.repo', () => {
  const groupId = 'group-123';
  const userId = 'user-456';
  const ownerId = 'user-owner';

  const mockGroup = {
    id: groupId,
    name: 'study group',
    description: 'study together',
    visibility: GroupVisibility.PUBLIC,
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Group Management', () => {
    it('nên tìm kiếm group bằng keyword', async () => {
      prismaMock.group.findMany.mockResolvedValue([mockGroup] as any);

      const result = await findGroupByKeyword('study');

      expect(prismaMock.group.findMany).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('nên tạo group mới và tự động gán OWNER', async () => {
      prismaMock.group.create.mockResolvedValue(mockGroup as any);

      const groupData = { name: 'study group', visibility: GroupVisibility.PUBLIC };
      const result = await createGroup(groupData, ownerId);

      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: {
          name: groupData.name,
          visibility: groupData.visibility,
          avatarUrl: undefined,
          coverUrl: undefined,
          description: undefined,
          members: {
            create: { userId: ownerId, role: GroupRole.OWNER },
          },
        },
      });
      expect(result).toEqual(mockGroup);
    });

    it('nên lấy danh sách group của tôi', async () => {
      prismaMock.group.findMany.mockResolvedValue([mockGroup] as any);

      const result = await getMyListGroup(userId);

      expect(prismaMock.group.findMany).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('nên tìm group bằng id', async () => {
      prismaMock.group.findFirst.mockResolvedValue(mockGroup as any);

      const result = await findGroupById(groupId, userId);

      expect(prismaMock.group.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it('nên cập nhật thông tin group', async () => {
      prismaMock.group.update.mockResolvedValue({ ...mockGroup, name: 'new name' } as any);

      const result = await updateGroupInfo({ name: 'new name' }, groupId);

      expect(prismaMock.group.update).toHaveBeenCalled();
      expect(result.name).toBe('new name');
    });

    it('nên xóa mềm group', async () => {
      prismaMock.group.update.mockResolvedValue({ ...mockGroup, isDeleted: true } as any);

      const result = await softDeleteGroup(groupId);

      expect(prismaMock.group.update).toHaveBeenCalled();
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('Group Members', () => {
    it('nên tìm thông tin thành viên group', async () => {
      const mockMember = { groupId, userId, role: GroupRole.MEMBER };
      prismaMock.groupMember.findUnique.mockResolvedValue(mockMember as any);

      const result = await findGroupMember(groupId, userId);

      expect(prismaMock.groupMember.findUnique).toHaveBeenCalledWith({
        where: {
          groupId_userId: { groupId, userId },
        },
      });
      expect(result).toEqual(mockMember);
    });

    it('nên xác thực quyền OWNER của thành viên', async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({ role: GroupRole.OWNER } as any);

      const result = await isGroupOwner(userId, groupId);

      expect(prismaMock.groupMember.findUnique).toHaveBeenCalledWith({
        where: {
          groupId_userId: { userId, groupId },
        },
      });
      expect(result).toBe(true);
    });

    it('nên lấy danh sách thành viên trong group', async () => {
      prismaMock.groupMember.findMany.mockResolvedValue([{ userId }] as any);

      const result = await getGroupMembers(groupId);

      expect(prismaMock.groupMember.findMany).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('nên thêm thành viên vào group', async () => {
      prismaMock.groupMember.create.mockResolvedValue({ groupId, userId, role: GroupRole.MEMBER } as any);

      const result = await addMemberGroup(groupId, userId, GroupRole.MEMBER, ownerId);

      expect(prismaMock.groupMember.create).toHaveBeenCalled();
      expect(result.role).toBe(GroupRole.MEMBER);
    });

    it('nên xóa thành viên khỏi group', async () => {
      prismaMock.groupMember.delete.mockResolvedValue({ groupId, userId } as any);

      const result = await removeGroupMember(groupId, userId);

      expect(prismaMock.groupMember.delete).toHaveBeenCalled();
      expect(result.userId).toBe(userId);
    });

    it('nên thay đổi vai trò của thành viên', async () => {
      prismaMock.groupMember.update.mockResolvedValue({ groupId, userId, role: GroupRole.OWNER } as any);

      const result = await changeRoleMember(groupId, userId, GroupRole.OWNER);

      expect(prismaMock.groupMember.update).toHaveBeenCalled();
      expect(result.role).toBe(GroupRole.OWNER);
    });
  });

  describe('Group Invitations', () => {
    it('nên tìm lời mời đang chờ xử lý', async () => {
      prismaMock.groupInvitation.findFirst.mockResolvedValue({ id: 'invite-1' } as any);

      const result = await findRequestPendingInvitation(groupId, userId);

      expect(prismaMock.groupInvitation.findFirst).toHaveBeenCalled();
      expect(result?.id).toBe('invite-1');
    });

    it('nên tạo lời mời mới', async () => {
      prismaMock.groupInvitation.create.mockResolvedValue({ id: 'invite-1' } as any);

      const result = await createInvitation(groupId, userId, ownerId, InvitationType.INVITE, InvitationStatus.PENDING);

      expect(prismaMock.groupInvitation.create).toHaveBeenCalled();
      expect(result.id).toBe('invite-1');
    });

    it('nên cập nhật trạng thái lời mời', async () => {
      prismaMock.groupInvitation.update.mockResolvedValue({ id: 'invite-1', status: InvitationStatus.ACCEPTED } as any);

      const result = await updateStatusInvitation(groupId, 'invite-1', InvitationStatus.ACCEPTED);

      expect(prismaMock.groupInvitation.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { status: InvitationStatus.ACCEPTED },
      });
      expect(result.status).toBe(InvitationStatus.ACCEPTED);
    });
  });
});

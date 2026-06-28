import { describe, it, expect } from 'vitest';
import {
  findGroups,
  findGroupById,
  toggleGroupStatus,
  deleteGroup,
} from '../../repositories/admin/group.repo';
import { prismaMock } from '../setup';
import { GroupVisibility } from '@prisma/client';

describe('admin group.repo', () => {
  const groupId = 'group-123';
  const mockGroup = {
    id: groupId,
    name: 'Research Club',
    description: 'A study group',
    visibility: GroupVisibility.PUBLIC,
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      members: 5,
      documents: 2,
    },
  };

  describe('findGroups', () => {
    it('nên tìm kiếm và lấy danh sách các nhóm học tập cho admin', async () => {
      prismaMock.group.findMany.mockResolvedValue([mockGroup] as any);
      prismaMock.group.count.mockResolvedValue(1);

      const result = await findGroups(
        { search: 'Research', isActive: true, isPublic: true },
        { page: 1, limit: 10 }
      );

      expect(prismaMock.group.findMany).toHaveBeenCalled();
      expect(prismaMock.group.count).toHaveBeenCalled();
      expect(result.groups.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findGroupById', () => {
    it('nên lấy chi tiết nhóm học tập kèm danh sách thành viên', async () => {
      const mockDetailedGroup = {
        ...mockGroup,
        members: [
          { userId: 'user-1', role: 'MEMBER', user: { id: 'user-1', name: 'Member 1' } },
        ],
      };
      prismaMock.group.findFirst.mockResolvedValue(mockDetailedGroup as any);

      const result = await findGroupById(groupId);

      expect(prismaMock.group.findFirst).toHaveBeenCalledWith({
        where: { id: groupId, isDeleted: false },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockDetailedGroup);
    });
  });

  describe('toggleGroupStatus', () => {
    it('nên bật/tắt hoạt động của nhóm', async () => {
      prismaMock.group.update.mockResolvedValue({ id: groupId, name: 'Group', isActive: false } as any);

      const result = await toggleGroupStatus(groupId, false);

      expect(prismaMock.group.update).toHaveBeenCalledWith({
        where: { id: groupId },
        data: { isActive: false },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteGroup', () => {
    it('nên xóa mềm nhóm ở cấp admin', async () => {
      prismaMock.group.update.mockResolvedValue({ id: groupId, name: 'Group', isDeleted: true } as any);

      const result = await deleteGroup(groupId);

      expect(prismaMock.group.update).toHaveBeenCalledWith({
        where: { id: groupId },
        data: { isDeleted: true },
        select: expect.any(Object),
      });
      expect(result.isDeleted).toBe(true);
    });
  });
});

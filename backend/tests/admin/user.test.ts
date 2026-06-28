import { describe, it, expect } from 'vitest';
import {
  findUsers,
  findUserById,
  countUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../../repositories/admin/user.repo';
import { prismaMock } from '../setup';

describe('admin user.repo', () => {
  const userId = 'user-123';
  const mockUser = {
    id: userId,
    email: 'user@test.com',
    name: 'John Doe',
    avatarUrl: null,
    bio: 'Hello',
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findUsers', () => {
    it('nên lấy danh sách người dùng cho admin', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser] as any);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await findUsers(
        { search: 'John', isActive: true },
        { page: 1, limit: 10 }
      );

      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(prismaMock.user.count).toHaveBeenCalled();
      expect(result.users.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findUserById', () => {
    it('nên lấy thông tin người dùng theo ID cho admin', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

      const result = await findUserById(userId);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, isDeleted: false },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('countUsers', () => {
    it('nên đếm số lượng người dùng theo bộ lọc', async () => {
      prismaMock.user.count.mockResolvedValue(5);

      const result = await countUsers({ isActive: true });

      expect(prismaMock.user.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('updateUser', () => {
    it('nên cập nhật hồ sơ người dùng', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, name: 'John Updated' } as any);

      const result = await updateUser(userId, { name: 'John Updated' });

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(result.name).toBe('John Updated');
    });
  });

  describe('deleteUser', () => {
    it('nên xóa mềm người dùng', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, isDeleted: true } as any);

      const result = await deleteUser(userId);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isDeleted: true },
        select: expect.any(Object),
      });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('toggleUserStatus', () => {
    it('nên bật/tắt kích hoạt tài khoản', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, isActive: false } as any);

      const result = await toggleUserStatus(userId, false);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(false);
    });
  });
});

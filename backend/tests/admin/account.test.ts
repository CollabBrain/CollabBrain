import { describe, it, expect } from 'vitest';
import {
  findAccounts,
  findAccountById,
  countAccounts,
  updateAccount,
  deleteAccount,
  createAccount,
  toggleAccountStatus,
} from '../../repositories/admin/account.repo';
import { prismaMock } from '../setup';
import { AccountRole } from '@prisma/client';

describe('admin account.repo', () => {
  const accountId = 'acc-123';
  const mockAccount = {
    id: accountId,
    username: 'admin1',
    role: AccountRole.ADMIN,
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findAccounts', () => {
    it('nên lấy danh sách tài khoản theo bộ lọc và phân trang', async () => {
      prismaMock.account.findMany.mockResolvedValue([mockAccount]);
      prismaMock.account.count.mockResolvedValue(1);

      const result = await findAccounts(
        { search: 'admin', role: 'ADMIN', isActive: true },
        { page: 1, limit: 10 }
      );

      expect(prismaMock.account.findMany).toHaveBeenCalled();
      expect(prismaMock.account.count).toHaveBeenCalled();
      expect(result.accounts.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findAccountById', () => {
    it('nên lấy tài khoản hoạt động bằng ID', async () => {
      prismaMock.account.findFirst.mockResolvedValue(mockAccount);

      const result = await findAccountById(accountId);

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, isDeleted: false },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('countAccounts', () => {
    it('nên đếm tổng số lượng tài khoản theo bộ lọc', async () => {
      prismaMock.account.count.mockResolvedValue(5);

      const result = await countAccounts({ role: 'STAFF' });

      expect(prismaMock.account.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('updateAccount', () => {
    it('nên cập nhật thông tin tài khoản', async () => {
      prismaMock.account.update.mockResolvedValue({ ...mockAccount, role: AccountRole.MANAGER });

      const result = await updateAccount(accountId, { role: AccountRole.MANAGER });

      expect(prismaMock.account.update).toHaveBeenCalled();
      expect(result.role).toBe(AccountRole.MANAGER);
    });
  });

  describe('deleteAccount', () => {
    it('nên xóa mềm tài khoản', async () => {
      prismaMock.account.update.mockResolvedValue({ ...mockAccount, isDeleted: true } as any);

      const result = await deleteAccount(accountId);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { isDeleted: true },
        select: expect.any(Object),
      });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('createAccount', () => {
    it('nên tạo tài khoản quản trị mới', async () => {
      prismaMock.account.create.mockResolvedValue(mockAccount);

      const result = await createAccount({
        username: 'staff1',
        passwordHash: 'hashed',
        role: 'STAFF',
      });

      expect(prismaMock.account.create).toHaveBeenCalled();
      expect(result.username).toBe('admin1');
    });
  });

  describe('toggleAccountStatus', () => {
    it('nên bật/tắt hoạt động của tài khoản', async () => {
      prismaMock.account.update.mockResolvedValue({ ...mockAccount, isActive: false });

      const result = await toggleAccountStatus(accountId, false);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { isActive: false },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  findAccountByUsername,
  findAccountById,
} from '../../repositories/admin/admin.repo';
import { prismaMock } from '../setup';

describe('admin.repo', () => {
  const username = 'admin1';
  const id = 'acc-123';
  const mockAccount = {
    id,
    username,
    isActive: true,
    isDeleted: false,
  };

  describe('findAccountByUsername', () => {
    it('nên lấy tài khoản quản trị hoạt động bằng username', async () => {
      prismaMock.account.findFirst.mockResolvedValue(mockAccount as any);

      const result = await findAccountByUsername(username);

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: {
          username,
          isDeleted: false,
          isActive: true,
        },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('findAccountById', () => {
    it('nên lấy tài khoản quản trị hoạt động bằng ID', async () => {
      prismaMock.account.findFirst.mockResolvedValue(mockAccount as any);

      const result = await findAccountById(id);

      expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          isDeleted: false,
        },
      });
      expect(result).toEqual(mockAccount);
    });
  });
});

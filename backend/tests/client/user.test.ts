import { describe, it, expect } from 'vitest';
import {
  findUserByEmail,
  findUserById,
  findAnyUserByEmail,
  createUser,
  saveOTP,
  findOTPByEmail,
  deleteOTP,
  resetPasswordUser,
  updateDataUser,
  userPublicSelect,
} from '../../repositories/client/user.repo';
import { prismaMock } from '../setup';

describe('user.repo', () => {
  const email = 'user@example.com';
  const userId = 'user-123';
  const mockUser = {
    id: userId,
    email,
    passwordHash: 'hashedpassword',
    name: 'Jane Doe',
    avatarUrl: null,
    coverUrl: null,
    bio: null,
    status: null,
    statusExpiresAt: null,
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findUserByEmail', () => {
    it('nên tìm thấy user hoạt động và chưa bị xóa theo email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await findUserByEmail(email);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email,
          isDeleted: false,
          isActive: true,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserById', () => {
    it('nên tìm thấy user và trả về các trường public theo id', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await findUserById(userId);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: userId,
          isDeleted: false,
          isActive: true,
        },
        select: userPublicSelect,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAnyUserByEmail', () => {
    it('nên tìm thấy bất kỳ user nào theo email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await findAnyUserByEmail(email);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('nên tạo user mới thành công', async () => {
      const createData = {
        email,
        passwordHash: 'hashed',
        name: 'Jane Doe',
      };

      prismaMock.user.create.mockResolvedValue({ id: userId, ...createData } as any);

      const result = await createUser(createData);

      expect(prismaMock.user.create).toHaveBeenCalledWith({ data: createData });
      expect(result.id).toBe(userId);
    });
  });

  describe('OTP Management', () => {
    const otpData = {
      email,
      otp: '123456',
      expiresAt: new Date(),
    };

    it('nên lưu OTP thành công bằng upsert', async () => {
      prismaMock.otpVerification.upsert.mockResolvedValue({ id: 'otp-1', ...otpData });

      const result = await saveOTP(otpData);

      expect(prismaMock.otpVerification.upsert).toHaveBeenCalledWith({
        where: { email },
        update: { otp: otpData.otp, expiresAt: otpData.expiresAt },
        create: otpData,
      });
      expect(result.otp).toBe('123456');
    });

    it('nên tìm thấy OTP bằng email', async () => {
      prismaMock.otpVerification.findUnique.mockResolvedValue({ id: 'otp-1', ...otpData });

      const result = await findOTPByEmail(email);

      expect(prismaMock.otpVerification.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result?.otp).toBe('123456');
    });

    it('nên xóa OTP bằng email', async () => {
      prismaMock.otpVerification.delete.mockResolvedValue({ id: 'otp-1', ...otpData });

      const result = await deleteOTP(email);

      expect(prismaMock.otpVerification.delete).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result.id).toBe('otp-1');
    });
  });

  describe('resetPasswordUser', () => {
    it('nên cập nhật passwordHash của user', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, passwordHash: 'newhashed' });

      const result = await resetPasswordUser({ email, passwordHash: 'newhashed' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { email },
        data: { passwordHash: 'newhashed' },
      });
      expect(result.passwordHash).toBe('newhashed');
    });
  });

  describe('updateDataUser', () => {
    it('nên cập nhật các thông tin khác của user và trả về các trường public', async () => {
      const updatePayload = { name: 'Jane Updated', bio: 'Hello world' };
      prismaMock.user.update.mockResolvedValue({ ...mockUser, ...updatePayload });

      const result = await updateDataUser(userId, updatePayload);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updatePayload,
        select: userPublicSelect,
      });
      expect(result.name).toBe('Jane Updated');
    });
  });
});

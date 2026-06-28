import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loginService,
  registerService,
  verifyOTPRegister,
} from '../../services/client/user.service';
import bcrypt from 'bcrypt';
import * as jwtHelpers from '../../helpers/jwt';
import * as userRepo from '../../repositories/client/user.repo';
import * as mailHelpers from '../../helpers/sendmail';

// Mock các thư viện và module phụ thuộc
vi.mock('bcrypt');
vi.mock('../../helpers/jwt');
vi.mock('../../repositories/client/user.repo');
vi.mock('../../helpers/sendmail');

describe('user.service (Auth Logic)', () => {
  const email = 'test@example.com';
  const password = 'password123';
  const passwordHash = 'hashedPassword';
  const userId = 'user-123';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('loginService', () => {
    it('nên đăng nhập thành công và trả về access & refresh token khi mật khẩu đúng', async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue({
        id: userId,
        email,
        passwordHash,
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      vi.mocked(jwtHelpers.generateUserAccessToken).mockReturnValue('mock-access-token');
      vi.mocked(jwtHelpers.generateUserRefreshToken).mockReturnValue('mock-refresh-token');

      const result = await loginService({ email, password });

      expect(userRepo.findUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, passwordHash);
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('nên quăng lỗi nếu không tìm thấy user', async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);

      await expect(loginService({ email, password })).rejects.toThrow("Không tìm thấy user");
    });

    it('nên quăng lỗi nếu sai mật khẩu', async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue({
        id: userId,
        email,
        passwordHash,
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(loginService({ email, password })).rejects.toThrow("Sai mật khẩu");
    });
  });

  describe('registerService', () => {
    it('nên quăng lỗi nếu email đã tồn tại', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue({ id: userId } as any);

      await expect(registerService({ email, password, name: 'Jane' })).rejects.toThrow("Người dùng đã tồn tại!!!");
    });

    it('nên tạo OTP, lưu vào DB và gửi email xác thực nếu đăng ký mới', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.saveOTP).mockResolvedValue({} as any);
      vi.mocked(mailHelpers.sendmail).mockResolvedValue({} as any);

      const result = await registerService({ email, password, name: 'Jane' });

      expect(userRepo.saveOTP).toHaveBeenCalledWith({
        email,
        otp: expect.any(String),
        expiresAt: expect.any(Date),
      });
      expect(mailHelpers.sendmail).toHaveBeenCalledWith(
        email,
        "OTP Xác Thực Đăng Kí",
        expect.stringContaining("Mã OTP của bạn là")
      );
      expect(result.message).toBe("Đã gửi OTP về mail");
    });
  });

  describe('verifyOTPRegister', () => {
    const registerData = {
      email,
      otp: '123456',
      password,
      name: 'Jane Doe',
    };

    it('nên ném lỗi nếu người dùng đã tồn tại', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue({ id: userId } as any);

      await expect(verifyOTPRegister(registerData)).rejects.toThrow("Người dùng đã tồn tại");
    });

    it('nên ném lỗi nếu không tìm thấy OTP', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.findOTPByEmail).mockResolvedValue(null);

      await expect(verifyOTPRegister(registerData)).rejects.toThrow("OTP không tồn tại");
    });

    it('nên ném lỗi nếu nhập sai OTP', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.findOTPByEmail).mockResolvedValue({
        otp: '999999',
        expiresAt: new Date(Date.now() + 10000),
      } as any);

      await expect(verifyOTPRegister(registerData)).rejects.toThrow("OTP không đúng");
    });

    it('nên ném lỗi nếu OTP đã hết hạn', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.findOTPByEmail).mockResolvedValue({
        otp: '123456',
        expiresAt: new Date(Date.now() - 10000), // đã hết hạn
      } as any);

      await expect(verifyOTPRegister(registerData)).rejects.toThrow("OTP đã hết hạn");
    });

    it('nên xác thực thành công, băm mật khẩu, tạo user mới và trả về tokens', async () => {
      vi.mocked(userRepo.findAnyUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.findOTPByEmail).mockResolvedValue({
        otp: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      } as any);
      vi.mocked(bcrypt.hash).mockResolvedValue(passwordHash as never);
      vi.mocked(userRepo.createUser).mockResolvedValue({ id: userId, email } as any);
      vi.mocked(userRepo.deleteOTP).mockResolvedValue({} as any);

      vi.mocked(jwtHelpers.generateUserAccessToken).mockReturnValue('access');
      vi.mocked(jwtHelpers.generateUserRefreshToken).mockReturnValue('refresh');

      const result = await verifyOTPRegister(registerData);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(userRepo.createUser).toHaveBeenCalledWith({ email, passwordHash, name: 'Jane Doe' });
      expect(userRepo.deleteOTP).toHaveBeenCalledWith(email);
      expect(result).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
    });
  });
});

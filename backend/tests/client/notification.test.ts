import { describe, it, expect } from 'vitest';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '../../repositories/client/notification.repo';
import { prismaMock } from '../setup';

describe('notification.repo', () => {
  const userId = 'user-123';
  const mockSettings = {
    id: 'notif-1',
    userId,
    enableAll: true,
    enableChat: true,
    enableFriend: true,
    enableGroup: true,
    enableSystem: true,
    enableSound: true,
    enableVibrate: true,
    chatPriority: 'HIGH',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getNotificationSettings', () => {
    it('nên trả về cấu hình thông báo nếu đã tồn tại', async () => {
      prismaMock.userNotificationSettings.findUnique.mockResolvedValue(mockSettings);

      const result = await getNotificationSettings(userId);

      expect(prismaMock.userNotificationSettings.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual(mockSettings);
      expect(prismaMock.userNotificationSettings.create).not.toHaveBeenCalled();
    });

    it('nên tạo cấu hình thông báo mặc định nếu chưa tồn tại', async () => {
      prismaMock.userNotificationSettings.findUnique.mockResolvedValue(null);
      prismaMock.userNotificationSettings.create.mockResolvedValue(mockSettings);

      const result = await getNotificationSettings(userId);

      expect(prismaMock.userNotificationSettings.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaMock.userNotificationSettings.create).toHaveBeenCalledWith({
        data: { userId },
      });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateNotificationSettings', () => {
    it('nên upsert để cập nhật cấu hình thông báo của user', async () => {
      const updateData = {
        enableSound: false,
        chatPriority: 'LOW',
      };

      const updatedSettings = {
        ...mockSettings,
        ...updateData,
      };

      prismaMock.userNotificationSettings.upsert.mockResolvedValue(updatedSettings);

      const result = await updateNotificationSettings(userId, updateData);

      expect(prismaMock.userNotificationSettings.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: updateData,
        create: { userId, ...updateData },
      });
      expect(result.enableSound).toBe(false);
      expect(result.chatPriority).toBe('LOW');
    });
  });
});

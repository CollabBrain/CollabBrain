import { describe, it, expect } from 'vitest';
import {
  getSettingByKey,
  getAllSettings,
  upsertSetting,
} from '../../repositories/client/setting.repo';
import { prismaMock } from '../setup';

describe('setting.repo', () => {
  const key = 'site_name';
  const value = 'CollabBrain App';

  describe('getSettingByKey', () => {
    it('nên lấy cấu hình bằng key', async () => {
      const mockSetting = { id: '1', key, value, createdAt: new Date(), updatedAt: new Date() };

      prismaMock.siteSetting.findUnique.mockResolvedValue(mockSetting);

      const result = await getSettingByKey(key);

      expect(prismaMock.siteSetting.findUnique).toHaveBeenCalledWith({
        where: { key },
      });
      expect(result).toEqual(mockSetting);
    });
  });

  describe('getAllSettings', () => {
    it('nên lấy toàn bộ danh sách cấu hình', async () => {
      const mockSettings = [
        { id: '1', key: 'key1', value: 'value1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', key: 'key2', value: 'value2', createdAt: new Date(), updatedAt: new Date() },
      ];

      prismaMock.siteSetting.findMany.mockResolvedValue(mockSettings);

      const result = await getAllSettings();

      expect(prismaMock.siteSetting.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });
  });

  describe('upsertSetting', () => {
    it('nên thêm mới hoặc cập nhật cấu hình', async () => {
      const mockSetting = { id: '1', key, value, createdAt: new Date(), updatedAt: new Date() };

      prismaMock.siteSetting.upsert.mockResolvedValue(mockSetting);

      const result = await upsertSetting(key, value);

      expect(prismaMock.siteSetting.upsert).toHaveBeenCalledWith({
        where: { key },
        update: { value },
        create: { key, value },
      });
      expect(result).toEqual(mockSetting);
    });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotificationSettings';

// Mock các custom hooks liên quan tới react-query
vi.mock('@/hooks/useNotificationSettings', () => ({
  useNotificationSettings: vi.fn(),
  useUpdateNotificationSettings: vi.fn(),
}));

describe('NotificationSettingsPanel Component', () => {
  const mockMutate = vi.fn();
  const mockSettings = {
    enableAll: true,
    enableChat: true,
    enableFriend: false,
    enableGroup: true,
    enableSystem: true,
    enableSound: true,
    enableVibrate: false,
    chatPriority: 'HIGH' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Giả lập trạng thái của useNotificationSettings
    vi.mocked(useNotificationSettings).mockReturnValue({
      data: mockSettings,
      isLoading: false,
      isError: false,
    } as any);

    // Giả lập mutate cho useUpdateNotificationSettings
    vi.mocked(useUpdateNotificationSettings).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    } as any);
  });

  it('nên hiển thị tiêu đề và mô tả chính xác', () => {
    render(<NotificationSettingsPanel />);
    expect(screen.getByText('Cài đặt thông báo')).toBeInTheDocument();
    expect(screen.getByText('Quản lý cách bạn nhận thông báo')).toBeInTheDocument();
  });

  it('nên hiển thị đúng trạng thái của các nút switch từ data', () => {
    render(<NotificationSettingsPanel />);
    
    // Kiểm tra các phần tử nhãn của Toggle
    expect(screen.getByText('Bật tất cả thông báo')).toBeInTheDocument();
    expect(screen.getByText('Tin nhắn chat')).toBeInTheDocument();
    expect(screen.getByText('Lời mời kết bạn')).toBeInTheDocument();
    expect(screen.getByText('Thông báo nhóm')).toBeInTheDocument();
  });

  it('nên kích hoạt sự kiện cập nhật cấu hình khi click chuyển đổi (toggle)', () => {
    render(<NotificationSettingsPanel />);
    
    // Tìm phần tử bọc ngoài của Tin nhắn chat và lấy nút button của Toggle
    const chatToggleRow = screen.getByText('Tin nhắn chat').closest('.justify-between');
    const toggleButton = chatToggleRow?.querySelector('button');
    
    expect(toggleButton).toBeTruthy();
    fireEvent.click(toggleButton!);

    expect(mockMutate).toHaveBeenCalledWith({ enableChat: false });
  });

  it('nên kích hoạt sự kiện thay đổi độ ưu tiên khi chọn mức độ ưu tiên chat', () => {
    render(<NotificationSettingsPanel />);

    // Độ ưu tiên hiển thị các nhãn "Cao", "Trung bình", "Thấp"
    const mediumButton = screen.getByText('Trung bình');
    fireEvent.click(mediumButton);

    expect(mockMutate).toHaveBeenCalledWith({ chatPriority: 'MEDIUM' });
  });
});

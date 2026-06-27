import axiosInstance from '../../../services/axiosInstance';
import type { ApiResponse, EditProfilePayload, UpdateStatusPayload, User } from '../../../types';

// GET /profile  → lấy thông tin user (cần Bearer token)
export const getProfileApi = () =>
  axiosInstance.get<ApiResponse<User>>('/profile');

// PATCH /profile  → cập nhật thông tin user
export const editProfileApi = (data: EditProfilePayload) =>
  axiosInstance.patch<ApiResponse<User>>('/profile', data);

// PATCH /profile/status → đặt/xóa status (max 80 ký tự, tự hết hạn sau 24h)
export const updateStatusApi = (data: UpdateStatusPayload) =>
  axiosInstance.patch<ApiResponse<User>>('/profile/status', data);


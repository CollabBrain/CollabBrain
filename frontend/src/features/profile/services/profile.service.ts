import axiosInstance from '../../../services/axiosInstance';
import type { ApiResponse, EditProfilePayload, User } from '../../../types';

// GET /profile  → lấy thông tin user (cần Bearer token)
export const getProfileApi = () =>
  axiosInstance.get<ApiResponse<User>>('/profile');

// PATCH /profile  → cập nhật thông tin user
export const editProfileApi = (data: EditProfilePayload) =>
  axiosInstance.patch<ApiResponse<User>>('/profile', data);

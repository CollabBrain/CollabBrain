import axiosInstance from '../../../services/axiosInstance';
import type {
  LoginPayload,
  RegisterPayload,
  VerifyOtpRegisterPayload,
  ForgotPasswordPayload,
  VerifyOtpForgotPayload,
  ResetPasswordPayload,
  AuthTokens,
  ApiResponse,
} from '../../../types';

// POST /login
export const loginApi = (data: LoginPayload) =>
  axiosInstance.post<ApiResponse<AuthTokens>>('/login', data);

// POST /register  → gửi OTP
export const registerApi = (data: RegisterPayload) =>
  axiosInstance.post<ApiResponse<{ message: string }>>('/register', data);

// POST /register/verify-otp  → xác nhận OTP + tạo tài khoản
export const verifyOtpRegisterApi = (data: VerifyOtpRegisterPayload) =>
  axiosInstance.post<ApiResponse<AuthTokens>>('/register/verify-otp', data);

// POST /forgot-password/forgot  → gửi OTP
export const forgotPasswordApi = (data: ForgotPasswordPayload) =>
  axiosInstance.post<ApiResponse<{ message: string }>>('/forgot-password/forgot', data);

// POST /forgot-password/otp  → xác nhận OTP
export const verifyOtpForgotApi = (data: VerifyOtpForgotPayload) =>
  axiosInstance.post<ApiResponse<{ message: string }>>('/forgot-password/otp', data);

// POST /forgot-password/reset  → đặt lại mật khẩu
export const resetPasswordApi = (data: ResetPasswordPayload) =>
  axiosInstance.post<ApiResponse<{ message: string }>>('/forgot-password/reset', data);

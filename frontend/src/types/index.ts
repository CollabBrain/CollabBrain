// ========== User ==========
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== Auth Payloads ==========
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface VerifyOtpRegisterPayload {
  email: string;
  otp: string;
  password: string;
  name: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpForgotPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
}

// ========== Profile ==========
export interface EditProfilePayload {
  name?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
}

// ========== Auth Response ==========
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ========== API Response wrapper ==========
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

// ========== Common ==========
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

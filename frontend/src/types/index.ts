// ========== User ==========
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  status: string | null;         // GitHub-style status (max 80 chars)
  statusExpiresAt: string | null; // ISO string, expires after 24h
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  friendsCount?: number;
  publicDecks?: Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    createdAt: string;
    _count: { cards: number };
  }>;
  joinedGroups?: Array<{
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    visibility: string;
    _count: { members: number };
    role: string;
  }>;
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

export interface UpdateStatusPayload {
  status: string | null; // null = xóa status
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

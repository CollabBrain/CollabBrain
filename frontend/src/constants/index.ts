// API Base URL — khớp với backend route /user
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/user';

// App info
export const APP_NAME = 'CollabBrain';

// LocalStorage keys
export const TOKEN_KEY = 'collab_access_token';
export const REFRESH_TOKEN_KEY = 'collab_refresh_token';
export const USER_KEY = 'collab_user';

// Routes paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  CHAT: '/chat',
  DOCUMENTS: '/documents',
  GROUPS: '/groups',
  FRIENDS: '/friends',
  FLASHCARD: '/flashcard',
} as const;

import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[axiosInstance]', ...args);
const err = (...args: any[]) => console.error('[axiosInstance ERROR]', ...args);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

log('axiosInstance initialized, baseURL:', API_BASE_URL);

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  log('onTokenRefreshed, notifying', refreshSubscribers.length, 'callbacks');
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Gọi logout đúng cách: xóa cả localStorage lẫn Zustand persist,
 * sau đó redirect qua React Router thay vì window.location (gây reload loop).
 */
const forceLogout = (reason: string) => {
  err('forceLogout called, reason:', reason);
  // Xóa token trong localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Xóa Zustand persist storage để isAuthenticated = false
  localStorage.removeItem('auth-storage');
  // Soft redirect — dùng location chỉ 1 lần, khi Zustand đã clean
  window.location.replace('/login');
};

// Request: tự động đính kèm accessToken vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    log('REQUEST:', config.method?.toUpperCase(), config.url, token ? '(has token)' : '(NO TOKEN)');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    err('REQUEST ERROR:', error.message);
    return Promise.reject(error);
  }
);

// Response: xử lý lỗi 401 → refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    log('RESPONSE:', response.config.method?.toUpperCase(), response.config.url, '->', response.status);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    err('RESPONSE ERROR:', error.config?.method?.toUpperCase(), url, '->', status, error.response?.data);

    const originalRequest = error.config;

    if (status === 401 && !originalRequest._retry) {
      log('401 detected on', url, '- attempt refresh');

      if (isRefreshing) {
        log('already refreshing, queueing request');
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            log('retrying queued request with new token');
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance.request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        log('calling /refresh endpoint...');
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        log('refresh token from localStorage:', refreshToken ? 'EXISTS' : 'MISSING');
        const response = await axios.post(`${API_BASE_URL}/refresh`, {
          refreshToken
        }, {
          withCredentials: true,
        });

        log('refresh response:', response.data);
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        if (!accessToken || !newRefreshToken) {
          throw new Error('Refresh returned no tokens');
        }

        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        log('tokens saved to localStorage');

        onTokenRefreshed(accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        log('retrying original request with new token');
        return axiosInstance.request(originalRequest);
      } catch (refreshError: any) {
        err('refresh failed:', refreshError.message);
        isRefreshing = false;
        forceLogout('refresh failed: ' + refreshError.message);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

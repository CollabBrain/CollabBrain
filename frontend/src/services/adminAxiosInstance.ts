import axios from 'axios';

const getAdminBaseUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/user';
  if (base.endsWith('/user')) {
    return base.slice(0, -5) + '/admin';
  }
  return base + '/admin';
};

const adminAxiosInstance = axios.create({
  baseURL: getAdminBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const forceAdminLogout = () => {
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin-auth-storage');
  window.location.replace('/admin/login');
};

adminAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // For simplicity, if token expires, we just log out for admin panel
      forceAdminLogout();
    }
    return Promise.reject(error);
  }
);

export default adminAxiosInstance;

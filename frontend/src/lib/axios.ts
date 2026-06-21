import axios from "axios";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "../constants";

// Using environment variable or default to localhost
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding the bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
  (response) => {
    // The API contract mentions { success, data, message, error }
    // We can extract data here if we want, or just return the response
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle 401: clean up ALL auth state including Zustand persist
      if (error.response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem("auth-storage");
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosInstance;

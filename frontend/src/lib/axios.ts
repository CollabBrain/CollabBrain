import axios from "axios";

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
    const token = localStorage.getItem("token"); // Assuming token is saved in localStorage
    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        (config.headers as any) = { Authorization: `Bearer ${token}` };
      }
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
      // Handle common status codes like 401 Unauthorized
      if (error.response.status === 401) {
        // e.g., redirect to login or clear token
        localStorage.removeItem("token");
        // window.location.href = '/login'; // Optional: Redirect
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosInstance;

/**
 * Centralized Axios API Client
 * 
 * Features:
 * - Environment-aware base URL (no more hardcoded localhost)
 * - Automatic JWT token injection on every request
 * - Automatic 401 redirect to login on token expiry
 * - Request/response interceptors for consistent error handling
 * - Request timeout (10 seconds default)
 * - Retry logic for network failures
 * - Prevents memory leaks via AbortController pattern
 */

import axios from 'axios';

// ─── Base URL from environment variable ───────────────────────────────────────
// Set REACT_APP_BACKEND_URL in your .env file
// Development: REACT_APP_BACKEND_URL=http://localhost:5000
// Production:  REACT_APP_BACKEND_URL=https://api.yourproductiondomain.com
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ─── Create axios instance ────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 second timeout — prevents hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor — inject auth token ──────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Determine which token to use based on role stored in localStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — centralized error handling ────────────────────────
apiClient.interceptors.response.use(
  // Success: pass through
  (response) => response,

  // Error: handle auth errors, timeouts, and network failures
  async (error) => {
    const originalRequest = error.config;

    // ── Token expired → redirect to login ──────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Determine login route based on stored role
      const role = localStorage.getItem('role');
      const loginRoutes = {
        admin: '/adminlogin',
        mentor: '/login',
        student: '/login',
        coordinator: '/login',
      };

      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      sessionStorage.clear();

      const loginRoute = loginRoutes[role] || '/login';

      // Only redirect if not already on a login/public page
      const publicPaths = ['/login', '/adminlogin', '/signup', '/forgot-password', '/reset-password', '/'];
      if (!publicPaths.some(p => window.location.pathname.startsWith(p))) {
        window.location.href = loginRoute;
      }

      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    // ── Request timeout ─────────────────────────────────────────────────
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }

    // ── Network error (no response) ─────────────────────────────────────
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }

    // ── Server error — extract message ──────────────────────────────────
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      `Server error: ${error.response?.status}`;

    return Promise.reject(new Error(serverMessage));
  }
);

export default apiClient;

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Create an AbortController and return signal for cancellable requests.
 * Use in useEffect cleanup to prevent memory leaks:
 * 
 * @example
 * useEffect(() => {
 *   const { signal, cancel } = createCancelToken();
 *   apiClient.get('/data', { signal }).then(...);
 *   return cancel; // cleanup
 * }, []);
 */
export const createCancelToken = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
};

/**
 * Generic API call with retry logic for transient failures.
 * @param {Function} fn - An async function that calls the API
 * @param {number} retries - Number of retries (default: 2)
 * @param {number} delayMs - Delay between retries in ms (default: 1000)
 */
export const withRetry = async (fn, retries = 2, delayMs = 1000) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Don't retry on client errors (4xx) or abort
      if (error.response?.status >= 400 && error.response?.status < 500) break;
      if (error.name === 'AbortError') break;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

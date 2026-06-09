/**
 * Frontend Configuration
 * 
 * IMPORTANT: Use REACT_APP_BACKEND_URL environment variable in production.
 * This file provides a fallback for backward compatibility only.
 * 
 * Prefer importing from './services/apiClient' for all new API calls.
 */

const config = {
  // Reads from environment variable, falls back to localhost for development
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',

  // Socket.IO configuration
  socketOptions: {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Search debounce delay
  searchDebounceMs: 400,
};

export default config;

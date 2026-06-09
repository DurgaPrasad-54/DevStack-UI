/**
 * Custom React Hooks for API Calls
 *
 * Features:
 * - useApi: Fetches data on mount with automatic cleanup (no memory leaks)
 * - useDebounce: Debounces a value for search inputs
 * - usePaginatedApi: Handles paginated API responses
 * - useInfiniteScroll: Infinite scroll with Intersection Observer
 *
 * All hooks automatically:
 *  - Set loading state
 *  - Catch errors
 *  - Cancel pending requests on unmount
 *  - Prevent setState on unmounted component
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import apiClient from '../services/apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// useApi — fetch data once (or when dependencies change)
// ─────────────────────────────────────────────────────────────────────────────
export function useApi(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    dependencies = [],
    skip = false,        // Set true to skip fetching (e.g. when URL is not ready)
    transform = null,    // Optional function to transform response data
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: !skip,
    error: null,
  });

  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (skip || !url) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Cancel previous request if still in flight
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.request({
        method,
        url,
        data: body,
        signal: abortRef.current.signal,
      });

      const data = transform ? transform(response.data) : response.data;
      setState({ data, loading: false, error: null });
    } catch (err) {
      // Ignore abort errors (caused by cleanup)
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      setState({ data: null, loading: false, error: err.message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, method, skip, ...dependencies]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ─────────────────────────────────────────────────────────────────────────────
// useDebounce — debounce any value (great for search inputs)
// ─────────────────────────────────────────────────────────────────────────────
export function useDebounce(value, delayMs = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// usePaginatedApi — fetches paginated data with built-in state
// ─────────────────────────────────────────────────────────────────────────────
export function usePaginatedApi(baseUrl, options = {}) {
  const {
    pageSize = 20,
    initialPage = 1,
    queryParams = {},
    skip = false,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [state, setState] = useState({
    data: [],
    total: 0,
    totalPages: 0,
    loading: false,
    error: null,
  });

  const abortRef = useRef(null);

  // Build URL with pagination and query params
  const url = useMemo(() => {
    if (!baseUrl) return null;
    const params = new URLSearchParams({
      page,
      limit: pageSize,
      ...queryParams,
    });
    return `${baseUrl}?${params.toString()}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, page, pageSize, JSON.stringify(queryParams)]);

  useEffect(() => {
    if (skip || !url) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    apiClient.get(url, { signal: abortRef.current.signal })
      .then(({ data }) => {
        // Support both { data: { students: [], pagination: {} } } and flat arrays
        const items = data?.data?.students || data?.data?.items || data?.data || data || [];
        const pagination = data?.data?.pagination || {};
        setState({
          data: items,
          total: pagination.totalCount || items.length,
          totalPages: pagination.totalPages || 1,
          loading: false,
          error: null,
        });
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      });

    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [url, skip]);

  const goToPage    = useCallback((p) => setPage(p), []);
  const nextPage    = useCallback(() => setPage(p => p + 1), []);
  const prevPage    = useCallback(() => setPage(p => Math.max(1, p - 1)), []);

  return { ...state, page, goToPage, nextPage, prevPage };
}

// ─────────────────────────────────────────────────────────────────────────────
// useThrottle — throttle function calls (good for scroll/resize handlers)
// ─────────────────────────────────────────────────────────────────────────────
export function useThrottle(fn, limitMs = 200) {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    const remaining = limitMs - (now - lastRan.current);

    clearTimeout(timeoutRef.current);

    if (remaining <= 0) {
      lastRan.current = now;
      fn(...args);
    } else {
      timeoutRef.current = setTimeout(() => {
        lastRan.current = Date.now();
        fn(...args);
      }, remaining);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, limitMs]);
}

// ─────────────────────────────────────────────────────────────────────────────
// useIntersectionObserver — detect when an element enters the viewport
// Used for infinite scroll and lazy loading images
// ─────────────────────────────────────────────────────────────────────────────
export function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, { threshold: 0.1, ...options });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}

// ─────────────────────────────────────────────────────────────────────────────
// useLocalStorage — synced localStorage with state
// ─────────────────────────────────────────────────────────────────────────────
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error(`useLocalStorage[${key}] error:`, err);
    }
  }, [key, value]);

  return [value, setStoredValue];
}

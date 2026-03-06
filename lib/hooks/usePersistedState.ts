import { useState, useEffect } from 'react';

/**
 * Hook to persist state to localStorage
 * @param key - localStorage key
 * @param initialValue - initial value if nothing in localStorage
 * @returns [state, setState] tuple
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use initialValue
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[usePersistedState] Error loading ${key}:`, error);
      return initialValue;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`[usePersistedState] Error saving ${key}:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Hook to persist page state (filters, search, sort, pagination)
 * @param pageKey - unique key for the page (e.g., 'schedules', 'reports')
 * @param initialState - initial state object
 * @returns [state, setState] tuple
 */
export function usePageState<T extends Record<string, any>>(
  pageKey: string,
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = usePersistedState<T>(`page_state_${pageKey}`, initialState);

  // Update function that merges partial updates
  const updateState = (updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Reset function to clear state
  const resetState = () => {
    setState(initialState);
  };

  return [state, updateState, resetState];
}

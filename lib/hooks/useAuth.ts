/**
 * useAuth Hook
 * Simplified authentication - checks session once per 24 hours
 */

import { useState, useEffect } from 'react';
import { authService } from '@/lib/services/auth.service';
import type { User } from '@/lib/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes in storage
    const handleStorageChange = (changes: any) => {
      if (changes.user) {
        const newUser = changes.user.newValue || null;
        setUser(newUser);
        setAuthenticated(!!newUser);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  /**
   * Check authentication status
   * Uses authService.initialize() which handles 24-hour caching
   */
  const checkAuth = async () => {
    try {
      console.log('[useAuth] Checking authentication...');

      // Initialize checks if session is valid (24 hour cache)
      const isAuth = await authService.initialize();

      if (isAuth) {
        // Load user from storage
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setAuthenticated(true);
        console.log('[useAuth] User authenticated');
      } else {
        setUser(null);
        setAuthenticated(false);
        console.log('[useAuth] User not authenticated');
      }
    } catch (error) {
      console.error('[useAuth] Error checking auth:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('[useAuth] Logout error:', error);
    }
  };

  /**
   * Refresh user data from backend
   */
  const refresh = async () => {
    try {
      await authService.refreshUserData();
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('[useAuth] Refresh error:', error);
    }
  };

  /**
   * Force session check (bypasses 24h cache)
   */
  const forceCheck = async () => {
    try {
      setLoading(true);
      const isValid = await authService.forceSessionCheck();

      if (isValid) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }

      return isValid;
    } catch (error) {
      console.error('[useAuth] Force check error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    authenticated,
    logout,
    refresh,
    forceCheck,
  };
}

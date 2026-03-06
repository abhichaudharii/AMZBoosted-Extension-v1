/**
 * Authentication Service
 * Simple cookie-based token auth with API fallback
 */

import { apiClient } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secure-storage';
import type { User } from '@/lib/types/auth';

class AuthService {
    /**
     * Initialize auth - try to get token from website cookies
     */
    async initialize(): Promise<boolean> {
        console.log('[Auth] Initializing...');

        try {
            // OPTIMIZATION: Check local storage first and return immediately if present
            // This is the "Stale-While-Revalidate" pattern
            const [tokenResult, userResult] = await Promise.all([
                secureStorage.get('accessToken'),
                secureStorage.get('user')
            ]);

            if (tokenResult.accessToken && userResult.user) {
                console.log('[Auth] ✓ Found cached session (Optimistic load)');

                // Load token into client immediately so subsequent requests work
                await apiClient.loadToken();

                // Trigger background verification (fire and forget)
                // We don't await this so the UI loads instantly
                this.verifySessionInBackground();

                return true;
            }

            // Fallback: If no local data, try to get from website (slower)
            return await this.initializeFromWebsite();
        } catch (error) {
            console.error('[Auth] Initialize failed:', error);
            return false;
        }
    }

    /**
     * Background session verification
     */
    private async verifySessionInBackground(): Promise<void> {
        console.log('[Auth] Verifying session in background...');
        try {
            // Check if token in cookie still matches or if we need to refresh
            const cookieToken = await this.getTokenFromCookie();
            if (cookieToken) {
                // Check if it's different (user switched accounts on website?)
                const currentToken = (await secureStorage.get('accessToken')).accessToken;
                if (currentToken && currentToken !== cookieToken) {
                    console.log('[Auth] Limit/Token mismatch detected, syncing with website...');
                    await secureStorage.set({ accessToken: cookieToken });
                    await apiClient.loadToken();
                }
            }

            // Refresh critical user data in parallel
            // We force refresh (true) to bypass cache and get latest data from server
            await Promise.all([
                apiClient.getUser(true),
                apiClient.getCredits(true),
                apiClient.getSubscriptionStatus(true),
                apiClient.getLimits(true)
            ]);

            // Validate session is still active
            const sessionValid = await apiClient.validateSession();
            if (!sessionValid.valid) {
                console.warn('[Auth] Background verification failed - session invalid');
                // The validateSession call already clears storage if invalid
                // We might want to notify UI here in future
            } else {
                console.log('[Auth] Background verification successful');
            }
        } catch (e) {
            console.error('[Auth] Background verification error', e);
        }
    }

    /**
     * Legacy initialization from website (fallback)
     */
    private async initializeFromWebsite(): Promise<boolean> {
        try {
            // Try to get token from website cookies first
            const tokenFromCookie = await this.getTokenFromCookie();

            if (tokenFromCookie) {
                console.log('[Auth] ✓ Found token in website cookie');
                // Save to storage
                await secureStorage.set({ accessToken: tokenFromCookie });
                // Load into API client
                await apiClient.loadToken();

                // Try to get user info with this token
                const userResult = await apiClient.getUser();
                if (userResult) {
                    await secureStorage.set({ user: userResult });
                    console.log('[Auth] ✓ User authenticated from cookie:', userResult.email);
                    return true;
                }
            }

            // SKIP CACHE: We want to verify login status with the website every time
            // This ensures if user logs out on website, they are logged out here too

            // No cookie AND no storage - try calling API (user might be logged in on website)
            console.log('[Auth] No cookie/storage found, trying to get session from website...');
            const sessionResult = await this.tryGetSessionFromWebsite();
            if (sessionResult) {
                return true;
            }

            console.log('[Auth] ✗ No token found - user needs to login on website');
            return false;
        } catch (error) {
            console.error('[Auth] Website initialize failed:', error);
            return false;
        }
    }

    /**
     * Get access token from website cookie
     */
    private async getTokenFromCookie(): Promise<string | null> {
        try {
            const baseUrl = apiClient.getBaseURL();
            const url = new URL(baseUrl);

            // Get cookie from website domain
            const cookie = await chrome.cookies.get({
                url: baseUrl,
                name: 'amz_access_token',
            });

            if (cookie && cookie.value) {
                console.log('[Auth] Found cookie token:', cookie.value.substring(0, 20) + '...');
                return cookie.value;
            }

            console.log('[Auth] No cookie found on domain:', url.hostname);
            return null;
        } catch (error) {
            console.error('[Auth] Failed to read cookie:', error);
            return null;
        }
    }

    /**
     * Try to get session from website (user logged in via Clerk)
     * This is a fallback when cookie isn't set yet
     */
    private async tryGetSessionFromWebsite(): Promise<boolean> {
        try {
            const baseUrl = apiClient.getBaseURL().replace('/api/v1', '');
            const sessionUrl = `${baseUrl}/api/v1/auth/session`;

            console.log('[Auth] Calling session endpoint:', sessionUrl);

            // Make request with credentials (Clerk cookies)
            const response = await fetch(sessionUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Auth] Session response:', { success: data.success, hasData: !!data.data });

                if (data.success && data.data && data.data.user) {
                    // Save access token
                    if (data.data.accessToken) {
                        await secureStorage.set({ accessToken: data.data.accessToken });
                        await apiClient.loadToken();
                        console.log('[Auth] ✓ Access token obtained from session endpoint');
                    }

                    // Save user
                    await secureStorage.set({ user: data.data.user });

                    // Save credits and limits if provided
                    if (data.data.credits) {
                        await secureStorage.set({ credits: data.data.credits });
                    }
                    if (data.data.limits) {
                        await secureStorage.set({ limits: data.data.limits });
                    }

                    console.log('[Auth] ✓ User authenticated via session endpoint:', data.data.user.email);
                    return true;
                }
            }

            console.log('[Auth] ✗ Session endpoint returned no data (status:', response.status, ')');
            return false;
        } catch (error) {
            console.error('[Auth] Failed to get session from website:', error);
            return false;
        }
    }

    /**
     * Logout - clear local session and cookies
     */
    async logout(): Promise<void> {
        console.log('[Auth] Logging out...');

        // Call backend logout endpoint
        try {
            await apiClient.logout();

            // Also call website logout to clear server session
            const baseUrl = apiClient.getBaseURL().replace('/api/v1', '');
            console.log('[Auth] Calling website logout:', `${baseUrl}/api/auth/logout`);

            await fetch(`${baseUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include', // Include cookies for session
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('[Auth] ✓ Website logout called');
        } catch (error) {
            console.error('[Auth] Backend logout failed:', error);
        }

        // Clear ALL cookies from the website domain
        try {
            const baseUrl = apiClient.getBaseURL();
            const url = new URL(baseUrl);

            // Get all cookies for this domain
            const allCookies = await chrome.cookies.getAll({ domain: url.hostname });
            console.log(`[Auth] Found ${allCookies.length} cookies to clear`);

            // Remove each cookie
            for (const cookie of allCookies) {
                await chrome.cookies.remove({
                    url: baseUrl,
                    name: cookie.name,
                });
                console.log(`[Auth] ✓ Cleared cookie: ${cookie.name}`);
            }

            console.log('[Auth] ✓ All cookies cleared');
        } catch (error) {
            console.error('[Auth] Failed to clear cookies:', error);
        }

        // IMPORTANT: Clear local storage to prevent auto-login
        await this.clearSession();
        console.log('[Auth] ✓ Local storage cleared');
    }

    /**
     * Clear session from local storage
     */
    private async clearSession(): Promise<void> {
        // Clear all user-specific data to prevent leakage
        await secureStorage.remove([
            'user',
            'accessToken',
            'credits',
            'limits',
            'limitsTimestamp',
            'logs',
            'usageStats',
            'backupHistory',
            'user_settings',
            'msg_credits'
        ]);

        // Also clear any dynamic tool states or form data if possible, 
        // but for now, the above covers the critical PII and account limits.

        console.log('[Auth] Session cleared (user data removed)');
    }

    /**
     * Get current user from storage
     */
    async getCurrentUser(): Promise<User | null> {
        const result = await secureStorage.get('user');
        return result.user || null;
    }

    /**
     * Check if user is authenticated (has user and token in storage)
     */
    async isAuthenticated(): Promise<boolean> {
        // Use parallel get for speed
        const [userResult, tokenResult] = await Promise.all([
            secureStorage.get('user'),
            secureStorage.get('accessToken')
        ]);
        return !!(userResult.user && tokenResult.accessToken);
    }

    /**
     * Refresh user data from backend
     */
    async refreshUserData(): Promise<void> {
        try {
            await apiClient.getUser();
            await apiClient.getCredits();
            await apiClient.getLimits();
        } catch (error) {
            console.error('[Auth] Failed to refresh user data:', error);
            // If 401, clear session and force re-auth
            if (error instanceof Error && error.message.includes('401')) {
                console.log('[Auth] Token invalid - clearing session');
                await this.clearSession();
            }
        }
    }

    /**
     * Force session check (re-run initialize logic)
     */
    async forceSessionCheck(): Promise<boolean> {
        console.log('[Auth] Force checking session...');
        // Clear cached data and re-initialize
        await this.clearSession();
        return await this.initialize();
    }
}

export const authService = new AuthService();

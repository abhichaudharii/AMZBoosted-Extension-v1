/**
 * useFeatures Hook
 * Centralized feature gating and permission logic
 * Derives state from UserContext for reactive updates
 */

import { useUserContext } from '@/lib/contexts/UserContext';
import { getSubscriptionState, SubscriptionState } from '@/lib/utils/subscription';

export type FeatureType = 'notification_channel' | 'integration' | 'tool';

export interface UseFeaturesReturn {
    loading: boolean;
    checkPermission: (type: FeatureType, key: string) => boolean;
    getUpgradeMessage: (type: FeatureType, key: string) => string;
    isToolEnabled: (toolId: string) => boolean;
    getToolLimits: (toolId: string) => {
        creditsPerUrl: number;
        dailyLimit?: number;
        monthlyLimit?: number;
        rateLimit?: { requestsPerMinute: number };
    } | null;
}

export function useFeatures(): UseFeaturesReturn {
    const { user, limits: _limits, subscriptionStatus, loading } = useUserContext();

    /**
     * Check if a specific feature is allowed for the current user
     */
    const checkPermission = (type: FeatureType, key: string): boolean => {
        // 1. Loading state - default to locked (safe fail)
        if (loading || !user) return false;

        // 2. Trial Override - Everything is unlocked during valid trial
        const subState = getSubscriptionState(subscriptionStatus);
        if (subState === SubscriptionState.TRIAL_ACTIVE) return true;

        // 3. Determine Effective Plan Tier
        let planTier = user.plan || 'starter';

        // Check if subscription plan is higher (e.g. just upgraded but user profile not fully synced yet)
        if (subscriptionStatus?.planId) {
            const subPlan = subscriptionStatus.planId.toLowerCase();
            if (subPlan.includes('business') || subPlan.includes('enterprise')) {
                planTier = 'business';
            } else if (subPlan.includes('professional') && planTier === 'starter') {
                planTier = 'professional';
            }
        }

        // 4. Admin/Enterprise Override
        if (planTier === 'enterprise') return true;

        // 5. Specific Feature Logic
        switch (type) {
            case 'notification_channel':
                return checkNotificationPermission(key, planTier);
            case 'integration':
                return checkIntegrationPermission(key, planTier);
            case 'tool':
                return true; // Tools are generally available, limits handled by credits
            default:
                return false;
        }
    };

    // --- Internal Logic Helpers ---

    const checkNotificationPermission = (key: string, plan: string): boolean => {
        if (plan === 'business') return true; // Business gets all channels

        if (plan === 'professional') {
            // Professional gets Telegram & Discord, but NOT Slack
            if (key === 'slack') return false;
            return true;
        }

        return false; // Starter gets no external channels
    };

    const checkIntegrationPermission = (key: string, plan: string): boolean => {
        if (plan === 'business') return true; // Business gets all integrations

        if (plan === 'professional') {
            // Professional gets Google Integrations
            if (key === 'google_sheets' || key === 'google_drive') return true;
            return false;
        }

        return false; // Starter gets no integrations
    };

    /**
     * Get upgrade message for locked features
     */
    const getUpgradeMessage = (type: FeatureType, key: string): string => {
        if (key === 'slack' || type === 'integration' && !['google_sheets', 'google_drive'].includes(key)) {
            return "Upgrade to Business Plan";
        }
        return "Upgrade to Professional Plan";
    };

    /**
     * Legacy tool check (kept for compatibility)
     */
    const isToolEnabled = (_toolId: string): boolean => true;

    /**
     * Get limits for a tool from the loaded plan limits
     */
    const getToolLimits = (_toolId: string) => {
        // We don't have per-tool limits in the 'limits' object structure exactly as before
        // But we can return defaults or mapping if needed. 
        // For now, returning null/defaults as most logic is credit-based.
        return {
            creditsPerUrl: 1, // Default
            dailyLimit: undefined,
            monthlyLimit: undefined,
            rateLimit: { requestsPerMinute: 60 }
        };
    };

    return {
        loading,
        checkPermission,
        getUpgradeMessage,
        isToolEnabled,
        getToolLimits,
    };
}

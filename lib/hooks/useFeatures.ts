/**
 * useFeatures Hook
 * Centralized feature gating and permission logic
 * Derives state from UserContext for reactive updates
 */

import { useUserContext } from '@/lib/contexts/UserContext';
import { getSubscriptionState, SubscriptionState } from '@/lib/utils/subscription';

export type FeatureType = 'notification_channel' | 'integration' | 'schedule' | 'limit';

export interface UseFeaturesReturn {
    loading: boolean;
    subscriptionState: SubscriptionState;
    checkPermission: (type: FeatureType, key: string, value?: any) => boolean;
    getUpgradeMessage: (type: FeatureType, key: string) => string;
}

export function useFeatures(): UseFeaturesReturn {
    const { user, limits, subscriptionStatus, loading } = useUserContext();
    const subState = getSubscriptionState(subscriptionStatus);

    /**
     * Check if a specific feature or limit is allowed
     */
    const checkPermission = (type: FeatureType, key: string, value?: any): boolean => {
        if (loading || !user) return false;

        // 1. Full Access during active trial or for enterprise
        if (subState === SubscriptionState.TRIAL_ACTIVE) return true;

        let planTier = user.plan || 'starter';
        if (subscriptionStatus?.planId) {
            const subPlan = subscriptionStatus.planId.toLowerCase();
            if (subPlan.includes('business') || subPlan.includes('enterprise')) planTier = 'business';
            else if (subPlan.includes('professional') && planTier === 'starter') planTier = 'professional';
        }

        if (planTier === 'enterprise' || planTier === 'business') {
            // Business/Enterprise still gated by specific numeric limits from the API if applicable
            // but generally have access to all feature types.
        }

        switch (type) {
            case 'notification_channel':
                return checkNotificationPermission(key, planTier);
            case 'integration':
                return checkIntegrationPermission(key, planTier);
            case 'schedule':
                return checkSchedulePermission(key, value, planTier);
            case 'limit':
                return checkLimitPermission(key, value);
            default:
                return false;
        }
    };

    // --- Internal Logic Helpers ---

    const checkNotificationPermission = (key: string, plan: string): boolean => {
        if (plan === 'business' || plan === 'enterprise') return true;
        if (plan === 'professional') return key !== 'slack';
        return false;
    };

    const checkIntegrationPermission = (key: string, plan: string): boolean => {
        if (plan === 'business' || plan === 'enterprise') return true;
        if (plan === 'professional') return ['google_sheets', 'google_drive'].includes(key);
        return false;
    };

    const checkSchedulePermission = (key: string, value: any, plan: string): boolean => {
        // key can be 'frequency', 'creation', etc.
        if (key === 'frequency') {
            const defaultAllowed = plan === 'starter' ? ['daily', 'weekly', 'monthly'] : ['hourly', 'daily', 'weekly', 'monthly'];
            const allowedFrequencies = limits?.allowedFrequencies || defaultAllowed;
            return allowedFrequencies.includes(value);
        }

        if (key === 'creation') {
            const defaultMax = plan === 'starter' ? 5 : plan === 'professional' ? 20 : 100;
            const maxSchedules = limits?.maxSchedules || defaultMax;
            const currentSchedules = value || 0;
            return currentSchedules < maxSchedules;
        }

        return true;
    };

    const checkLimitPermission = (key: string, value: any): boolean => {
        if (!limits) return true; // Fallback if limits not loaded

        const limitValue = (limits as any)[key];
        if (typeof limitValue === 'number') {
            return value < limitValue;
        }
        return true;
    };

    /**
     * Get upgrade message for locked features
     */
    const getUpgradeMessage = (type: FeatureType, key: string): string => {
        if (type === 'limit') return "Upgrade your plan to increase limits";
        if (key === 'slack' || (type === 'integration' && !['google_sheets', 'google_drive'].includes(key))) {
            return "Upgrade to Business Plan";
        }
        if (type === 'schedule' && key === 'frequency') {
            return "Upgrade for higher frequency scheduling";
        }
        return "Upgrade to Professional Plan";
    };

    return {
        loading,
        subscriptionState: subState,
        checkPermission,
        getUpgradeMessage,
    };
}

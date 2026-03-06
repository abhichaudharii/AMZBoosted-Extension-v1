import { getSubscriptionState, SubscriptionState } from './subscription';
import type { SubscriptionStatus } from '@/lib/types/subscription';

/**
 * Check if user has premium features access
 */
export function hasPremiumAccess(status: SubscriptionStatus | null): boolean {
    if (!status) {
        return false;
    }

    const state = getSubscriptionState(status);
    return state === SubscriptionState.PLAN_ACTIVE || state === SubscriptionState.TRIAL_ACTIVE;
}

/**
 * Check access rights with detailed reason
 */
export function checkAccess(status: SubscriptionStatus | null, _requiredLevel?: string): { allowed: boolean; reason?: SubscriptionState } {
    const state = getSubscriptionState(status);

    // 1. Basic active check (existing logic)
    const isActive = state === SubscriptionState.PLAN_ACTIVE || state === SubscriptionState.TRIAL_ACTIVE;

    // 2. If no specific level required, just check if active (or maybe even free is allowed?)
    // For now, preserving existing logic: generic check returning state.
    // If requiredLevel is 'free' or undefined, we might allow it? 
    // But the original logic was strict: must be active or trialing.
    // Let's assume all tools requiring checkAccess need active subscription for now.

    const allowed = isActive;

    return {
        allowed,
        reason: allowed ? undefined : state
    };
}

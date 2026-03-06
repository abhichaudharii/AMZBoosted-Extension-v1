import type { SubscriptionStatus } from '@/lib/types/subscription';

export enum SubscriptionState {
    NO_PLAN = 'no_plan',
    TRIAL_ACTIVE = 'trial_active',
    TRIAL_EXPIRED = 'trial_expired',
    PLAN_ACTIVE = 'plan_active',
    PLAN_EXPIRED = 'plan_expired',
}

export interface SubscriptionCTA {
    text: string;
    variant: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
    action: 'navigate_billing' | 'start_trial' | 'choose_plan' | 'renew_plan' | 'manage_subscription';
    urgency: 'none' | 'low' | 'medium' | 'high';
    badge?: string;
    description?: string;
}

export interface TrialProgress {
    daysRemaining: number;
    totalDays: number;
    percentage: number;
    urgencyLevel: 'safe' | 'warning' | 'urgent' | 'critical';
    color: string;
    message: string;
}

/**
 * Get the current subscription state from the server status object
 */
export function getSubscriptionState(status: SubscriptionStatus | null): SubscriptionState {
    if (!status) {
        return SubscriptionState.NO_PLAN;
    }

    // --- PRIORITY 1: Align with Website Dashboard Logic (overallState) ---

    // 1. Active Trial
    if (status.overallState === 'trial_active') {
        return SubscriptionState.TRIAL_ACTIVE;
    }

    // 2. Trial Expired / Used
    // Website treats 'trial_used' same as 'trial_expired' for CTA purposes
    if (status.overallState === 'trial_expired' || status.overallState === 'trial_used') {
        return SubscriptionState.TRIAL_EXPIRED;
    }

    // 3. Plan Expired / Past Due
    // Website treats 'plan_expired' OR 'isPastDue' as the "Payment Failed/Update Payment" state
    if (status.overallState === 'plan_expired' || status.isPastDue) {
        return SubscriptionState.PLAN_EXPIRED;
    }

    // 4. Active Plan
    if (status.overallState === 'plan_active' || status.isActive) {
        return SubscriptionState.PLAN_ACTIVE;
    }

    // 5. No Subscription
    if (status.overallState === 'no_subscription') {
        return SubscriptionState.NO_PLAN;
    }

    // --- PRIORITY 2: Fallbacks (Legacy / Incomplete Data) ---

    // Fallback: Trust 'trialState' if distinct
    if (status.trialState === 'active_trial') return SubscriptionState.TRIAL_ACTIVE;
    if (status.trialState === 'trial_expired') return SubscriptionState.TRIAL_EXPIRED;

    // Fallback: Check raw Stripe status status
    if (status.status === 'active') return SubscriptionState.PLAN_ACTIVE;
    if (status.status === 'trialing') return SubscriptionState.TRIAL_ACTIVE;

    // Fallback: If status is canceled/expired/past_due but we missed the overallState check above
    // We default to PLAN_EXPIRED if it looks like a paid plan failure, but be careful not to catch expired trials here if possible.
    // However, without overallState, distinguishing an expired trial from an expired plan is hard if we just see 'canceled'.
    // Given the API likely sends overallState, the above blocks should catch 99% of cases.
    if (status.status === 'past_due' || status.isPlanExpired) return SubscriptionState.PLAN_EXPIRED;

    return SubscriptionState.NO_PLAN;
}

/**
 * Get appropriate CTA for the current subscription state
 */
export function getSubscriptionCTA(state: SubscriptionState, context: 'sidebar' | 'navbar' | 'billing' = 'sidebar'): SubscriptionCTA {
    switch (state) {
        case SubscriptionState.NO_PLAN:
            return {
                text: context === 'sidebar' ? 'Start Free Trial' : 'Start Trial',
                variant: 'default',
                action: 'navigate_billing',
                urgency: 'low',
                badge: 'No Active Plan',
                description: 'Get unlimited usage & API access',
            };

        case SubscriptionState.TRIAL_ACTIVE:
            return {
                text: context === 'sidebar' ? 'Upgrade Now' : 'Choose Plan',
                variant: 'default',
                action: 'navigate_billing',
                urgency: 'medium',
                badge: 'Trial Active',
                description: 'Upgrade to keep access',
            };

        case SubscriptionState.TRIAL_EXPIRED:
            return {
                text: 'Choose a Plan',
                variant: 'default',
                action: 'choose_plan',
                urgency: 'high',
                badge: 'Trial Expired',
                description: 'Your trial has ended',
            };

        case SubscriptionState.PLAN_ACTIVE:
            return {
                text: context === 'sidebar' ? 'Manage Plan' : 'Manage Subscription',
                variant: 'outline',
                action: 'manage_subscription',
                urgency: 'none',
                badge: 'Active',
                description: 'Your subscription is active',
            };

        case SubscriptionState.PLAN_EXPIRED:
            return {
                text: 'Renew Subscription',
                variant: 'destructive',
                action: 'renew_plan',
                urgency: 'high',
                badge: 'Expired',
                description: 'Renew to restore access',
            };

        default:
            return {
                text: 'View Plans',
                variant: 'default',
                action: 'navigate_billing',
                urgency: 'none',
            };
    }
}

/**
 * Get trial progress information
 */
export function getTrialProgress(trialEndsAt: string | Date | null): TrialProgress | null {
    if (!trialEndsAt) {
        return null;
    }

    const endDate = typeof trialEndsAt === 'string' ? new Date(trialEndsAt) : trialEndsAt;
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = 14; // Assuming 14-day trial
    const percentage = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));

    let urgencyLevel: TrialProgress['urgencyLevel'];
    let color: string;
    let message: string;

    if (daysRemaining > 7) {
        urgencyLevel = 'safe';
        color = 'bg-green-500';
        message = `${daysRemaining} days remaining in your trial`;
    } else if (daysRemaining > 3) {
        urgencyLevel = 'warning';
        color = 'bg-yellow-500';
        message = `Only ${daysRemaining} days left in your trial`;
    } else if (daysRemaining > 0) {
        urgencyLevel = 'urgent';
        color = 'bg-orange-500';
        message = `Trial ending soon! ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`;
    } else {
        urgencyLevel = 'critical';
        color = 'bg-red-500';
        message = 'Your trial has ended';
    }

    return {
        daysRemaining,
        totalDays,
        percentage,
        urgencyLevel,
        color,
        message,
    };
}

/**
 * Get formatted plan display name
 */
export function getPlanDisplayName(planId: string | null | undefined, includeMember: boolean = true): string {
    if (!planId) {
        return 'No Active Plan';
    }

    // Capitalize first letter of each word
    const formatted = planId
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return includeMember ? `${formatted} Member` : formatted;
}

// checkAccess and hasPremiumAccess moved to access-control.ts to prevent circular dependencies

/**
 * Get days remaining in trial (0 if not in trial or expired)
 */
export function getTrialDaysRemaining(status: SubscriptionStatus | null): number {
    if (!status) {
        return 0;
    }

    const trialEndsAt = status.trialEndsAt;
    if (!trialEndsAt) {
        return 0;
    }

    const progress = getTrialProgress(trialEndsAt);
    return progress?.daysRemaining || 0;
}

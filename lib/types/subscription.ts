export interface SubscriptionStatus {
    hasSubscription: boolean;
    isActive: boolean;
    isTrialing: boolean;
    isCanceled: boolean;
    isPastDue: boolean;
    hasUsedTrial: boolean;
    canStartTrial: boolean;
    overallState: 'trial_active' | 'trial_used' | 'trial_expired' | 'plan_active' | 'plan_expired' | 'no_subscription';
    trialState: 'no_trial' | 'active_trial' | 'trial_used' | 'trial_expired';
    currentPlan: string | null;
    planId: string | null;
    planDetails?: {
        id: string;
        name: string;
        price: number;
        interval: string;
    };
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    dodoSubscriptionId: string | null;
    status: string; // 'trialing', 'active', etc.
    // Additional fields maintained for backward compatibility or extension specific needs
    updatedAt?: string;
    dbStatus?: string;
    isOnHold?: boolean;
    isPlanExpired?: boolean; // Changed to boolean to match meaningful usage, though website doesn't have it explicitly in interface shown
    requiresPaymentMethod?: boolean;
    isUsable?: boolean;
    trialUsedAt?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
}

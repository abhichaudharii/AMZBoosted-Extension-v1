import { useUserContext } from '@/lib/contexts/UserContext';

/**
 * Hook to access user credits with automatic updates from storage
 * Now uses Global UserContext to prevent duplicate requests
 */
export function useCredits() {
    const { credits, loading, refreshCredits } = useUserContext();
    return { credits, loading, refresh: refreshCredits };
}

/**
 * Hook to access plan limits with automatic updates from storage
 */
export function useLimits() {
    const { limits, loading, refreshLimits } = useUserContext();
    return { limits, loading, refresh: refreshLimits };
}

/**
 * Hook to access user profile with automatic updates from storage
 */
export function useUser() {
    const { user, loading, refreshUser } = useUserContext();
    // setUser is kept for interface compatibility but warns if used
    const setUser = (_u: any) => console.warn('setUser: Manual state update not supported in Context mode. Trigger a refresh instead.');

    return { user, loading, setUser, refresh: refreshUser };
}

/**
 * Hook to access subscription status with automatic updates from storage
 */
export function useSubscriptionStatus() {
    const { subscriptionStatus, loading, refreshSubscription } = useUserContext();
    return { status: subscriptionStatus, loading, refresh: refreshSubscription };
}


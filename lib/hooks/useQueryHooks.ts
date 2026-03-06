import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';


/**
 * Global Query Keys
 */
export const QUERY_KEYS = {
    USER: ['user'],
    CREDITS: ['credits'],
    LIMITS: ['limits'],
    SUBSCRIPTION: ['subscription'],
    USAGE: ['usage'],
    INTEGRATIONS: ['integrations'],
    AVAILABLE_INTEGRATIONS: ['available_integrations'],
    TOOLS: ['tools'],
    PLANS: ['plans'],
} as const;

/**
 * Hook to fetch user profile
 */
export function useUserQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.USER,
        queryFn: () => apiClient.getUser(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch user credits
 */
export function useCreditsQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.CREDITS,
        queryFn: () => apiClient.getCredits(),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook to fetch plan limits
 */
export function useLimitsQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.LIMITS,
        queryFn: () => apiClient.getLimits(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook to fetch subscription status
 */
export function useSubscriptionQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.SUBSCRIPTION,
        queryFn: () => apiClient.getSubscriptionStatus(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch usage stats
 */
export function useUsageStatsQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.USAGE,
        queryFn: () => apiClient.getUsageStats(),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook to fetch available plans
 */
export function usePlansQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.PLANS,
        queryFn: () => apiClient.getPlans(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Hook to fetch tools config
 */
export function useToolsQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.TOOLS,
        queryFn: () => apiClient.getTools(),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Mutation for updating profile
 */
export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { fullName?: string; timezone?: string; email?: string }) =>
            apiClient.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER });
        },
    });
}

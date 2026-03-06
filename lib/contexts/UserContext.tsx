import React, { createContext, useContext, useEffect, ReactNode } from 'react';

import type { User, Credits, PlanLimits } from '@/lib/types/auth';
import type { SubscriptionStatus } from '@/lib/types/subscription';
import { 
    useUserQuery, 
    useCreditsQuery, 
    useLimitsQuery, 
    useSubscriptionQuery,
    QUERY_KEYS
} from '@/lib/hooks/useQueryHooks';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/entrypoints/dashboard/components/QueryProvider';

interface UserContextType {
    user: User | null;
    credits: Credits | null;
    limits: PlanLimits | null;
    subscriptionStatus: SubscriptionStatus | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    refreshCredits: () => Promise<void>;
    refreshLimits: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
    refreshAll: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();

    // Use Query Hooks
    const userQuery = useUserQuery();
    const creditsQuery = useCreditsQuery();
    const limitsQuery = useLimitsQuery();
    const subscriptionQuery = useSubscriptionQuery();


    // Manual Refresh Function
    const refreshAll = async () => {
        await queryClient.invalidateQueries();
    };

    const value = {
        user: userQuery.data || null,
        credits: creditsQuery.data || null,
        limits: limitsQuery.data || null,
        subscriptionStatus: subscriptionQuery.data || null,
        loading: userQuery.isLoading || creditsQuery.isLoading || limitsQuery.isLoading,
        refreshUser: async () => { await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER }); },
        refreshCredits: async () => { await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CREDITS }); },
        refreshLimits: async () => { await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIMITS }); },
        refreshSubscription: async () => { await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBSCRIPTION }); },
        refreshAll
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

/**
 * Global UserProvider with TanStack Query support
 */
export const GlobalUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <QueryProvider>
            <UserProvider>
                {children}
            </UserProvider>
        </QueryProvider>
    );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};

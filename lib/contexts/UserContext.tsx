import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import type { User, Credits, PlanLimits } from '@/lib/types/auth';
import type { SubscriptionStatus } from '@/lib/types/subscription';

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
    const { authenticated } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [credits, setCredits] = useState<Credits | null>(null);
    const [limits, setLimits] = useState<PlanLimits | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        if (authenticated) {
            refreshAll();
        } else {
            setLoading(false);
        }
    }, [authenticated]);

    // Storage Listeners
    useEffect(() => {
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName !== 'local') return;

            if (changes.user) refreshUser(false); // false = don't force network, just re-read (actually client methods handle cache logic)
            // But wait, client methods read from storage cache? 
            // The client methods *write* to storage. 
            // If storage changed (e.g. from background), we should re-read via client methods (which check cache)?
            // Actually, if storage changed, we likely want to update state.
            // Client methods `getUser(false)` checks cache. If cache is fresh, returns it.
            // But if storage changed, the cache is effectively "fresh" but different?
            // The client methods implementing cache expiry logic.
            
            // Simpler: Just re-call the getters. They will return the new data from storage if it was updated there.
            if (changes.credits) refreshCredits(false);
            if (changes.limits) refreshLimits(false);
            if (changes.subscriptionStatus) refreshSubscription(false);
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const refreshUser = async (force = false) => {
        const data = await apiClient.getUser(force);
        setUser(data);
    };

    const refreshCredits = async (force = false) => {
        const data = await apiClient.getCredits(force);
        setCredits(data);
    };

    const refreshLimits = async (force = false) => {
        const data = await apiClient.getLimits(force);
        setLimits(data);
    };

    const refreshSubscription = async (force = false) => {
        const data = await apiClient.getSubscriptionStatus(force);
        setSubscriptionStatus(data);
    };

    const refreshAll = async () => {
        setLoading(true);
        try {
            await Promise.all([
                refreshUser(),
                refreshCredits(),
                refreshLimits(),
                refreshSubscription()
            ]);
        } catch (error) {
            console.error('Failed to refresh user data', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            credits,
            limits,
            subscriptionStatus,
            loading,
            refreshUser: () => refreshUser(true),
            refreshCredits: () => refreshCredits(true),
            refreshLimits: () => refreshLimits(true),
            refreshSubscription: () => refreshSubscription(true),
            refreshAll
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};

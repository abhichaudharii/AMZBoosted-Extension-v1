import type {
    User,
    Credits,
    PlanLimits,
    UsageStats,
    PlanStatus,
} from '@/lib/types/auth';
import type { SubscriptionStatus } from '@/lib/types/subscription';
import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';

export const UserService = {
    async getUser(client: IAPIClient, forceRefresh = false): Promise<User | null> {
        if (!forceRefresh) {
            const cachedUser = await secureStorage.get('user');
            const cachedTs = await secureStorage.get('userTimestamp');
            const now = Date.now();
            // 1 minute TTL
            if (cachedUser.user && cachedTs.userTimestamp && (now - cachedTs.userTimestamp < 60 * 1000)) {
                return cachedUser.user;
            }
        }

        const result = await client.request<User>('/user/profile');
        if (result.success && result.data) {
            await secureStorage.set({
                user: result.data,
                userTimestamp: Date.now()
            });
            return result.data;
        }
        return null;
    },

    async getCredits(client: IAPIClient, forceRefresh = false): Promise<Credits | null> {
        if (!forceRefresh) {
            const cachedCredits = await secureStorage.get('credits');
            const cachedTs = await secureStorage.get('creditsTimestamp');
            const now = Date.now();
            // 1 minute TTL
            if (cachedCredits.credits && cachedTs.creditsTimestamp && (now - cachedTs.creditsTimestamp < 60 * 1000)) {
                return cachedCredits.credits;
            }
        }

        // Updated to use the merged /user/usage endpoint
        const result = await client.request<{ credits: Credits; plan?: any }>('/user/usage');
        if (result.success && result.data && result.data.credits) {
            const dataToSave: any = {
                credits: result.data.credits,
                creditsTimestamp: Date.now()
            };

            await secureStorage.set(dataToSave);
            return result.data.credits;
        }
        return null;
    },

    async getLimits(client: IAPIClient, forceRefresh = false): Promise<PlanLimits | null> {
        if (!forceRefresh) {
            const cachedLimits = await secureStorage.get('limits');
            const cachedTs = await secureStorage.get('limitsTimestamp');
            const now = Date.now();
            // 1 minute TTL
            if (cachedLimits.limits && cachedTs.limitsTimestamp && (now - cachedTs.limitsTimestamp < 60 * 1000)) {
                return cachedLimits.limits;
            }
        }

        const result = await client.request<PlanLimits>('/user/limits');
        if (result.success && result.data) {
            await secureStorage.set({
                limits: result.data,
                limitsTimestamp: Date.now()
            });
            return result.data;
        }
        return null;
    },

    async getUsageStats(client: IAPIClient, forceRefresh = false): Promise<UsageStats | null> {
        if (!forceRefresh) {
            const cached = await secureStorage.get(['usageStats', 'usageStatsTimestamp']);
            const now = Date.now();
            // 1 minute TTL
            if (cached.usageStats && cached.usageStatsTimestamp && (now - cached.usageStatsTimestamp < 60 * 1000)) {
                return cached.usageStats;
            }
        }

        // Updated to reflect the full response structure: { usage, plan, credits }
        const result = await client.request<{ usage: UsageStats; plan?: PlanStatus; credits?: Credits }>('/user/usage');

        if (result.success && result.data) {
            const dataToSave: any = {};
            const now = Date.now();

            // 1. Usage Stats
            if (result.data.usage) {
                dataToSave.usageStats = result.data.usage;
                dataToSave.usageStatsTimestamp = now;
            }

            // 3. Credits
            if (result.data.credits) {
                dataToSave.credits = result.data.credits;
                dataToSave.creditsTimestamp = now;
            }

            // Save all updates in one go
            if (Object.keys(dataToSave).length > 0) {
                await secureStorage.set(dataToSave);
            }

            return result.data.usage || null;
        }
        return null;
    },

    async getSubscriptionStatus(client: IAPIClient, forceRefresh = false): Promise<SubscriptionStatus | null> {
        if (!forceRefresh) {
            const cachedStatus = await secureStorage.get('subscriptionStatus');
            const cachedTs = await secureStorage.get('subscriptionStatusTimestamp');
            const now = Date.now();
            // 1 minute TTL
            if (cachedStatus.subscriptionStatus && cachedTs.subscriptionStatusTimestamp && (now - cachedTs.subscriptionStatusTimestamp < 60 * 1000)) {
                return cachedStatus.subscriptionStatus;
            }
        }

        const result = await client.request<SubscriptionStatus>('/subscription/status');
        if (result.success && result.data) {
            await secureStorage.set({
                subscriptionStatus: result.data,
                subscriptionStatusTimestamp: Date.now()
            });
            return result.data;
        }
        return null;
    },

    async getPlans(client: IAPIClient, forceRefresh = false): Promise<any[] | null> {
        if (!forceRefresh) {
            const cachedPlans = await secureStorage.get('plans');
            const cachedTs = await secureStorage.get('plansTimestamp');
            const now = Date.now();
            // 1 minute TTL
            if (cachedPlans.plans && cachedTs.plansTimestamp && (now - cachedTs.plansTimestamp < 60 * 1000)) {
                return cachedPlans.plans;
            }
        }

        const result = await client.request<any[]>('/plans');
        if (result.success && result.data) {
            // Map API response to UI model
            const mappedPlans = result.data
                .filter((plan: any) => plan.id !== 'enterprise')
                .map((plan: any) => ({
                    id: plan.id,
                    name: plan.name,
                    price: plan.prices.monthly / 100, // Convert cents to dollars
                    annualPrice: plan.prices.annual / 100,
                    description: plan.description,
                    features: plan.features,
                    popular: plan.metadata?.popular || false,
                    color: plan.metadata?.color,
                    gradient: plan.metadata?.gradient,
                    trialDays: plan.prices?.trialDays || 14
                }));

            await secureStorage.set({
                plans: mappedPlans,
                plansTimestamp: Date.now()
            });
            return mappedPlans;
        }
        return null;
    },

    async updateProfile(client: IAPIClient, data: { fullName?: string; timezone?: string; email?: string }): Promise<any> {
        const result = await client.request<any>('/user/profile/update', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        return result.success && result.data ? result.data : null;
    },

    async changePassword(client: IAPIClient, currentPassword: string, newPassword: string): Promise<boolean> {
        const result = await client.request('/user/password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return result.success;
    }
};

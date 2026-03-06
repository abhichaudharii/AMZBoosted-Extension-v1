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
    async getUser(client: IAPIClient): Promise<User | null> {
        const result = await client.request<User>('/user/profile');
        if (result.success && result.data) {
            // We still update storage for components that rely on storage events
            // but the fetch decision is handled by the caller.
            await secureStorage.set({ user: result.data });
            return result.data;
        }
        return null;
    },

    async getCredits(client: IAPIClient): Promise<Credits | null> {
        // Updated to use the merged /user/usage endpoint
        const result = await client.request<{ credits: Credits; plan?: any }>('/user/usage');
        if (result.success && result.data && result.data.credits) {
            await secureStorage.set({ credits: result.data.credits });
            return result.data.credits;
        }
        return null;
    },

    async getLimits(client: IAPIClient): Promise<PlanLimits | null> {
        const result = await client.request<PlanLimits>('/user/limits');
        if (result.success && result.data) {
            await secureStorage.set({ limits: result.data });
            return result.data;
        }
        return null;
    },

    async getUsageStats(client: IAPIClient): Promise<UsageStats | null> {
        // Updated to reflect the full response structure: { usage, plan, credits }
        const result = await client.request<{ usage: UsageStats; plan?: PlanStatus; credits?: Credits }>('/user/usage');

        if (result.success && result.data) {
            const dataToSave: any = {};

            // 1. Usage Stats
            if (result.data.usage) {
                dataToSave.usageStats = result.data.usage;
            }

            // 3. Credits
            if (result.data.credits) {
                dataToSave.credits = result.data.credits;
            }

            // Save all updates in one go
            if (Object.keys(dataToSave).length > 0) {
                await secureStorage.set(dataToSave);
            }

            return result.data.usage || null;
        }
        return null;
    },

    async getSubscriptionStatus(client: IAPIClient): Promise<SubscriptionStatus | null> {
        const result = await client.request<SubscriptionStatus>('/subscription/status');
        if (result.success && result.data) {
            await secureStorage.set({ subscriptionStatus: result.data });
            return result.data;
        }
        return null;
    },

    async getPlans(client: IAPIClient): Promise<any[] | null> {
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

            await secureStorage.set({ plans: mappedPlans });
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

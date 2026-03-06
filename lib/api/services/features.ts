import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';
import { UserService } from './user';
import { ToolsService } from './tools';

export const FeaturesService = {
    async createExport(client: IAPIClient, data: any): Promise<{ success: boolean; error?: string }> {
        const result = await client.request<{ success: boolean; error?: string }>('/exports/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        return {
            success: result.success,
            error: result.error,
        };
    },

    async checkPermission(client: IAPIClient, data: {
        action: string;
        toolId: string;
        urlCount: number;
    }): Promise<{
        allowed: boolean;
        taskId?: string;
        creditsDeducted?: number;
        creditsRemaining?: number;
        reason?: string;
        code?: string;
        upgradeRequired?: string;
        upgradeUrl?: string;
        purchaseUrl?: string;
        resetsAt?: string;
        maxSchedules?: number;
        transactionId?: string;
    }> {
        const result = await client.request<any>('/permissions/check', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success && result.data) {
            return result.data;
        }

        return {
            allowed: false,
            reason: result.error || 'Permission check failed',
        };
    },

    async getAvailableFeatures(client: IAPIClient): Promise<{
        plan: string;
        tools: any[];
        features: any;
    } | null> {
        try {
            // Reconstruct features object from local cached data
            // This replaces the backend /features/available endpoint call

            const [limits, tools, subStatus] = await Promise.all([
                UserService.getLimits(client),
                ToolsService.getTools(client),
                UserService.getSubscriptionStatus(client)
            ]);

            const plan = subStatus?.overallState || 'starter'; // Default to starter if unknown

            // Map limits to the features structure expected by useFeatures
            // Defaults based on starter plan if limits are missing
            const features = {
                exportFormats: ['csv'], // Default
                maxScheduledTasks: limits?.maxSchedules || 5,
                prioritySupport: limits?.supportTier === 'priority' || limits?.supportTier === 'dedicated',
                apiAccess: limits?.features?.apiAccess || false,
                customReports: limits?.features?.advancedAnalytics || false,
                bulkOperations: plan !== 'starter',
                advancedFilters: true,
                // Add feature limit objects for checkFeaturePermission usage
                schedules: { enabled: true, maxPerMonth: limits?.maxSchedules || 5 },
                exports: { enabled: true, maxPerMonth: limits?.maxExportsPerMonth || 5 },
                integrations: { enabled: true, max: limits?.maxIntegrations || 0 },
                webhooks: { enabled: limits?.features?.customWebhooks || false, max: limits?.maxWebhooks || 0 }
            };

            // Enhance tools with enable state if needed (currently all enabled)
            const enabledTools = tools?.map(tool => ({
                ...tool,
                enabled: true
            })) || [];

            const result = {
                plan,
                tools: enabledTools,
                features
            };

            // Cache features locally (legacy compat)
            await secureStorage.set({ availableFeatures: result });
            return result;

        } catch (error) {
            console.error('[API] Failed to construct available features:', error);
            // Return minimal fallback
            return {
                plan: 'starter',
                tools: [],
                features: {
                    exportFormats: ['csv'],
                    maxScheduledTasks: 5,
                    prioritySupport: false,
                    apiAccess: false,
                    customReports: false,
                    bulkOperations: false,
                    advancedFilters: false,
                    schedules: { enabled: true, maxPerMonth: 5 },
                    exports: { enabled: true, maxPerMonth: 5 },
                    integrations: { enabled: false, max: 0 },
                    webhooks: { enabled: false, max: 0 }
                }
            };
        }
    }
};

/**
 * Credits Service
 * Manages credit balance, deductions, and warnings
 */

import { apiClient } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secure-storage';
import { analyticsService } from './analytics.service';
import type { Credits, PlanLimits } from '@/lib/types/auth';

class CreditsService {
    /**
     * Get current credit balance
     */
    async getCredits(): Promise<Credits | null> {
        return await apiClient.getCredits();
    }

    /**
     * Get plan limits
     */
    async getLimits(): Promise<PlanLimits | null> {
        return await apiClient.getLimits();
    }

    /**
     * Check if user has enough credits for an action
     */
    async hasEnoughCredits(required: number): Promise<boolean> {
        const credits = await this.getCredits();
        if (!credits) return false;

        return credits.remaining >= required;
    }

    /**
     * Calculate credits required for a tool run
     * Formula: 1 credit per URL
     */
    calculateCreditsRequired(urlCount: number): number {
        return urlCount;
    }

    /**
     * Check if action is allowed (credits + limits)
     */
    async canPerformAction(
        action: 'tool_run' | 'schedule' | 'integration' | 'export' | 'webhook' | 'api_key' | 'marketplace',
        params?: { urlCount?: number; marketplaceId?: string }
    ): Promise<{ allowed: boolean; reason?: string }> {
        const credits = await this.getCredits();
        const limits = await this.getLimits();

        if (!credits || !limits) {
            return { allowed: false, reason: 'Unable to fetch account data' };
        }

        switch (action) {
            case 'tool_run': {
                const required = this.calculateCreditsRequired(params?.urlCount || 1);
                if (credits.remaining < required) {
                    await analyticsService.trackCreditsDepleted();
                    return {
                        allowed: false,
                        reason: `Insufficient credits. You need ${required} credits but have ${credits.remaining} remaining.`,
                    };
                }
                return { allowed: true };
            }

            case 'schedule': {
                if (limits.maxSchedules === -1) return { allowed: true };

                const result = await secureStorage.get('schedulesCount');
                const currentCount = result.schedulesCount || 0;

                if (currentCount >= limits.maxSchedules) {
                    await analyticsService.trackLimitReached('schedules', currentCount, limits.maxSchedules);
                    return {
                        allowed: false,
                        reason: `Schedule limit reached. Your plan allows ${limits.maxSchedules} schedules.`,
                    };
                }
                return { allowed: true };
            }

            case 'integration': {
                if (limits.maxIntegrations === -1) return { allowed: true };

                const result = await secureStorage.get('integrationsCount');
                const currentCount = result.integrationsCount || 0;

                if (currentCount >= limits.maxIntegrations) {
                    await analyticsService.trackLimitReached(
                        'integrations',
                        currentCount,
                        limits.maxIntegrations
                    );
                    return {
                        allowed: false,
                        reason: `Integration limit reached. Your plan allows ${limits.maxIntegrations} integrations.`,
                    };
                }
                return { allowed: true };
            }

            case 'export': {
                if (limits.maxExportsPerMonth === -1) return { allowed: true };

                const result = await secureStorage.get('exportsThisMonth');
                const currentCount = result.exportsThisMonth || 0;

                if (currentCount >= limits.maxExportsPerMonth) {
                    await analyticsService.trackLimitReached(
                        'exports',
                        currentCount,
                        limits.maxExportsPerMonth
                    );
                    return {
                        allowed: false,
                        reason: `Export limit reached. Your plan allows ${limits.maxExportsPerMonth} exports per month.`,
                    };
                }
                return { allowed: true };
            }

            case 'webhook': {
                // maxWebhooks might be 0 for none, check strictly for -1
                if (limits.maxWebhooks === -1) return { allowed: true };

                const result = await secureStorage.get('webhooksCount');
                const currentCount = result.webhooksCount || 0;

                if (currentCount >= limits.maxWebhooks) {
                    await analyticsService.trackLimitReached('webhooks', currentCount, limits.maxWebhooks);
                    return {
                        allowed: false,
                        reason: `Webhook limit reached. Your plan allows ${limits.maxWebhooks} webhooks.`,
                    };
                }
                return { allowed: true };
            }

            case 'api_key': {
                if (limits.maxApiKeys === -1) return { allowed: true };

                const result = await secureStorage.get('apiKeysCount');
                const currentCount = result.apiKeysCount || 0;

                if (currentCount >= limits.maxApiKeys) {
                    await analyticsService.trackLimitReached('api_keys', currentCount, limits.maxApiKeys);
                    return {
                        allowed: false,
                        reason: `API key limit reached. Your plan allows ${limits.maxApiKeys} API keys.`,
                    };
                }
                return { allowed: true };
            }

            case 'marketplace': {
                // Check strictly for -1 (unlimited)
                if (limits.maxMarketplaces === -1) return { allowed: true };

                // TODO: Implement distinct marketplace usage tracking.
                // For now, we mainly rely on this check to allow "Unlimited" plans to proceed.
                // Restricted plans (e.g. Starter with 2) will need a mechanism to counts "used" marketplaces.

                // Temporary simplified check: if limit > 0, we assume it's allowed for now 
                // until "Active Marketplaces" selection UI is built.
                if (limits.maxMarketplaces > 0) return { allowed: true };

                return {
                    allowed: false,
                    reason: `Marketplace limit reached. Your plan allows ${limits.maxMarketplaces} marketplaces.`
                };
            }

            default:
                return { allowed: true };
        }
    }

    /**
     * Get credit warning level
     * Returns: 'none' | 'low' | 'critical' | 'depleted'
     */
    async getCreditWarningLevel(): Promise<'none' | 'low' | 'critical' | 'depleted'> {
        const credits = await this.getCredits();
        if (!credits) return 'none';

        const percentageRemaining = (credits.remaining / credits.total) * 100;

        if (credits.remaining === 0) return 'depleted';
        if (percentageRemaining <= 10) return 'critical';
        if (percentageRemaining <= 25) return 'low';
        return 'none';
    }

    /**
     * Refresh credit data from backend
     */
    async refresh(): Promise<void> {
        await apiClient.getCredits();
        await apiClient.getLimits();
    }

    /**
     * Get formatted credit message
     */
    async getCreditMessage(): Promise<string> {
        const credits = await this.getCredits();
        if (!credits) return 'Unable to load credits';

        const percentage = ((credits.remaining / credits.total) * 100).toFixed(0);
        return `${credits.remaining.toLocaleString()} / ${credits.total.toLocaleString()} credits (${percentage}%)`;
    }
}

export const creditsService = new CreditsService();

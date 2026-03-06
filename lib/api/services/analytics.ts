import type { AnalyticsEvent, ToolRunEvent } from '@/lib/types/analytics';
import { IAPIClient } from '../types';

export const AnalyticsService = {
    async trackEvent(client: IAPIClient, event: AnalyticsEvent): Promise<void> {
        // Fire and forget - don't wait for response
        client.request('/analytics/track', {
            method: 'POST',
            body: JSON.stringify(event),
        }).catch((error) => console.error('Failed to track event:', error));
    },

    async trackToolRun(client: IAPIClient, event: ToolRunEvent): Promise<void> {
        // Use the unified /analytics/track endpoint
        await client.request('/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                type: 'tool_run',
                toolId: event.toolId,
                marketplace: event.marketplace,
                urlCount: event.urlCount,
                success: event.success,
                duration: event.duration,
                creditsUsed: event.creditsUsed,
                metadata: event,
            }),
        }).catch((error) => console.error('Failed to track tool run:', error));
    },

    async trackScheduleExecution(client: IAPIClient, data: {
        scheduleId: string;
        toolId: string;
        marketplace: string;
        urlCount: number;
        triggeredBy: 'auto' | 'manual';
        success: boolean;
        duration?: number;
        creditsUsed: number;
    }): Promise<void> {
        await client.request('/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                type: data.triggeredBy === 'auto' ? 'schedule_run_auto' : 'schedule_run_manual',
                scheduleId: data.scheduleId,
                toolId: data.toolId,
                marketplace: data.marketplace,
                urlCount: data.urlCount,
                triggeredBy: data.triggeredBy,
                success: data.success,
                duration: data.duration,
                creditsUsed: data.creditsUsed,
                timestamp: new Date().toISOString(),
            }),
        }).catch((error) => console.error('Failed to track schedule execution:', error));
    }
};

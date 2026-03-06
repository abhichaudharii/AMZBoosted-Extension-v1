/**
 * Analytics Service
 * Tracks all user actions and sends to backend
 */

import { apiClient } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secure-storage';
import type { AnalyticsEvent, EventType, ToolRunEvent } from '@/lib/types/analytics';

class AnalyticsService {
    private sessionId: string = '';
    private eventQueue: AnalyticsEvent[] = [];
    private flushInterval: number | null = null;

    async initialize(): Promise<void> {
        // Get or create session ID
        const result = await secureStorage.get('sessionId');
        this.sessionId =
            result.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await secureStorage.set({ sessionId: this.sessionId });

        // Start auto-flush (every 30 seconds)
        this.flushInterval = window.setInterval(() => this.flush(), 30000);
    }

    /**
     * Track an event
     */
    async track(type: EventType, data: Record<string, any> = {}): Promise<void> {
        const user = await this.getCurrentUser();
        if (!user) return;

        const event: AnalyticsEvent = {
            type,
            timestamp: new Date().toISOString(),
            userId: user.id,
            sessionId: this.sessionId,
            data,
            metadata: {
                extensionVersion: chrome.runtime.getManifest().version,
                browser: 'Chrome',
                browserVersion: navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] || 'unknown',
                platform: navigator.platform,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };

        this.eventQueue.push(event);

        // Flush immediately for critical events
        if (this.isCriticalEvent(type)) {
            await this.flush();
        }
    }

    /**
     * Track tool run
     */
    async trackToolRun(event: ToolRunEvent): Promise<void> {
        await apiClient.trackToolRun(event);

        // Also track as analytics event
        await this.track('tool_run', {
            toolId: event.toolId,
            marketplace: event.marketplace,
            urlCount: event.urlCount,
            creditsUsed: event.creditsUsed,
            status: event.status,
        });
    }

    /**
     * Track page view
     */
    async trackPageView(page: string, previousPage?: string): Promise<void> {
        await this.track('page_viewed', { page, previousPage });
    }

    /**
     * Track feature usage
     */
    async trackFeature(feature: string, data: Record<string, any> = {}): Promise<void> {
        await this.track('feature_used', { feature, ...data });
    }

    /**
     * Track tool completion
     */
    async trackToolComplete(
        toolId: string,
        success: boolean,
        creditsUsed: number,
        duration: number
    ): Promise<void> {
        await this.track(success ? 'tool_complete' : 'tool_error', {
            toolId,
            success,
            creditsUsed,
            duration,
        });
    }

    /**
     * Track export generation
     */
    async trackExport(
        toolId: string,
        format: string,
        rowCount: number
    ): Promise<void> {
        await this.track('export_generated', {
            toolId,
            exportFormat: format,
            rowCount,
        });
    }

    /**
     * Track integration action
     */
    async trackIntegration(
        action: 'connected' | 'synced' | 'disconnected',
        integrationName: string
    ): Promise<void> {
        const eventType = action === 'synced' ? 'integration_synced' : 'integration_connected';
        await this.track(eventType, { integrationName, action });
    }

    /**
     * Track schedule action
     */
    async trackSchedule(
        action: 'created' | 'executed' | 'updated' | 'deleted',
        scheduleId: string,
        toolId: string
    ): Promise<void> {
        const eventType = action === 'executed' ? 'schedule_executed' : 'schedule_created';
        await this.track(eventType, { scheduleId, toolId, action });
    }

    /**
     * Track upgrade intent
     */
    async trackUpgradeIntent(source: string): Promise<void> {
        await this.track('upgrade_clicked', { source });
    }

    /**
     * Track limit reached
     */
    async trackLimitReached(limitType: string, currentValue: number, maxValue: number): Promise<void> {
        await this.track('limit_reached', { limitType, currentValue, maxValue });
    }

    /**
     * Track credits depleted
     */
    async trackCreditsDepleted(): Promise<void> {
        await this.track('credits_depleted', {});
    }

    /**
     * Flush event queue to backend
     */
    private async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        // Send all events in batch
        for (const event of events) {
            await apiClient.trackEvent(event);
        }
    }

    /**
     * Check if event is critical (needs immediate sending)
     */
    private isCriticalEvent(type: EventType): boolean {
        return [
            'tool_run',
            'tool_complete',
            'tool_error',
            'credits_depleted',
            'limit_reached',
        ].includes(type);
    }

    /**
     * Get current user
     */
    private async getCurrentUser(): Promise<{ id: string } | null> {
        const result = await secureStorage.get('user');
        return result.user || null;
    }

    /**
     * Clean up on logout
     */
    async destroy(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        await this.flush();
    }
}

export const analyticsService = new AnalyticsService();

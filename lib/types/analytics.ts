/**
 * Analytics & Tracking Types
 * All events sent to amzboosted.com backend for admin analytics
 */

export type EventType =
    | 'tool_run'
    | 'tool_complete'
    | 'tool_error'
    | 'schedule_created'
    | 'schedule_executed'
    | 'schedule_run_auto'
    | 'schedule_run_manual'
    | 'schedule_run_complete'
    | 'schedule_run_failed'
    | 'export_generated'
    | 'integration_connected'
    | 'integration_synced'
    | 'webhook_triggered'
    | 'report_viewed'
    | 'report_downloaded'
    | 'session_started'
    | 'session_ended'
    | 'page_viewed'
    | 'feature_used'
    | 'upgrade_clicked'
    | 'credits_depleted'
    | 'limit_reached'
    | 'permission_denied';

export interface AnalyticsEvent {
    // Event identification
    type: EventType;
    timestamp: string;

    // User context
    userId: string;
    sessionId: string;

    // Event data
    data: {
        // Tool-specific
        toolId?: string;
        toolName?: string;
        marketplace?: string;
        urlCount?: number;
        creditsUsed?: number;
        duration?: number;
        success?: boolean;
        errorCode?: string;

        // Feature-specific
        feature?: string;
        integrationName?: string;
        exportFormat?: string;
        scheduleFrequency?: string;

        // Navigation
        page?: string;
        previousPage?: string;

        // Additional metadata
        [key: string]: any;
    };

    // Device/browser info
    metadata: {
        extensionVersion: string;
        browser: string;
        browserVersion: string;
        platform: string;
        timezone: string;
    };
}

export interface ToolRunEvent {
    toolId: string;
    toolName?: string;
    marketplace: string;
    urlCount: number;
    delay: number;
    startTime: string;
    endTime?: string;
    status: 'running' | 'completed' | 'failed';
    creditsUsed: number;
    successCount?: number;
    errorCount?: number;
    errorMessages?: string[];
    success?: boolean;
    duration?: number;
}

export interface UserBehavior {
    // Engagement metrics
    totalSessions: number;
    avgSessionDuration: number;
    lastActiveAt: string;
    daysActive: number;

    // Tool usage patterns
    favoriteTools: string[];
    underutilizedTools: string[];
    toolDiversity: number; // How many different tools used

    // Feature adoption
    featuresUsed: string[];
    featuresNeverUsed: string[];

    // Conversion indicators
    upgradePromptViews: number;
    upgradeClicks: number;
    limitReachedCount: number;
}

export interface AdminAnalytics {
    // User segmentation
    userSegment: 'new' | 'active' | 'power' | 'churning' | 'churned';

    // Risk indicators
    churnRisk: number; // 0-100
    upsellPotential: number; // 0-100

    // Recommendations
    suggestedTools: string[];
    suggestedFeatures: string[];

    // Health score
    engagementScore: number; // 0-100
}

import { IAPIClient } from '../types';

export const SchedulesService = {
    /**
     * Check permission and deduct credits for a schedule run
     * Uses existing /permissions/check endpoint with action: 'run_schedule'
     */
    async startScheduleRun(client: IAPIClient, data: {
        scheduleId: string;
        toolId: string;
        marketplace: string;
        urlCount: number;
        triggeredBy: 'auto' | 'manual';
    }): Promise<{
        success: boolean;
        runId?: string;
        taskId?: string;
        creditsDeducted?: number;
        creditsRemaining?: number;
        transactionId?: string;
        error?: string;
        reason?: string;
    }> {
        // Use existing permissions/check endpoint
        const result = await client.request<{
            allowed: boolean;
            taskId?: string;
            runId?: string;
            creditsDeducted?: number;
            creditsRemaining?: number;
            transactionId?: string;
            reason?: string;
            code?: string;
        }>('/permissions/check', {
            method: 'POST',
            body: JSON.stringify({
                action: 'run_schedule',
                scheduleId: data.scheduleId,
                toolId: data.toolId,
                urlCount: data.urlCount,
                triggeredBy: data.triggeredBy,
            }),
        });

        if (result.success && result.data?.allowed) {
            return {
                success: true,
                runId: result.data.runId || result.data.taskId,
                taskId: result.data.taskId,
                creditsDeducted: result.data.creditsDeducted,
                creditsRemaining: result.data.creditsRemaining,
                transactionId: result.data.transactionId,
            };
        }

        return {
            success: false,
            error: result.data?.reason || result.error,
            reason: result.data?.reason || result.error,
        };
    },

    /**
     * Complete a schedule run with results (optional endpoint)
     * If endpoint doesn't exist yet, just track via analytics
     */
    async completeScheduleRun(client: IAPIClient, data: {
        runId: string;
        scheduleId: string;
        success: boolean;
        results?: any;
        errors?: string[];
        urlsProcessed: number;
        duration?: number;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const result = await client.request<{ success: boolean; error?: string }>('/schedules/complete', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            return {
                success: result.success,
                error: result.error,
            };
        } catch (error) {
            // If endpoint doesn't exist yet, log and continue
            console.warn('[API] /schedules/complete endpoint not available, continuing without completion tracking');
            return { success: true };
        }
    }
};

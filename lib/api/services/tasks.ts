// Tasks API service — wraps the /tasks/* endpoints on the backend.
// Used by tool-execution.service.ts to start tasks and finalize them.
import type { IAPIClient } from '../types';

export interface StartTaskRequest {
    toolId: string;
    inputCount: number;
}

export interface StartTaskResponse {
    taskId: string;
    creditsDeducted: number;
    newBalance: number;
}

export interface FinalizeTaskRequest {
    successfulCount: number;
    failedCount: number;
    errorTypes: string[];
    durationMs: number;
}

export interface FinalizeTaskResponse {
    taskId: string;
    creditsRefunded: number;
    finalBalance: number;
}

export interface TaskStatusResponse {
    taskId: string;
    toolId: string;
    status: 'processing' | 'completed' | 'errored' | 'timeout';
    creditsDeducted: number;
    creditsRefunded: number;
    successCount: number | null;
    failedCount: number | null;
    errorTypes: string[] | null;
    createdAt: string;
    finalizedAt: string | null;
}

export const TasksService = {
    /**
     * Start a task — deducts credits and returns a taskId.
     * Call this BEFORE executing tool logic.
     */
    async startTask(
        client: IAPIClient,
        data: StartTaskRequest
    ): Promise<StartTaskResponse | null> {
        const result = await client.request<StartTaskResponse>('/tasks/start', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success && result.data) {
            return result.data;
        }

        console.error('[TasksService] startTask failed:', result.error);
        return null;
    },

    /**
     * Finalize a task — reports success/failure counts and receives any credit refund.
     * MUST be called after tool execution, even if it failed.
     */
    async finalizeTask(
        client: IAPIClient,
        taskId: string,
        data: FinalizeTaskRequest
    ): Promise<FinalizeTaskResponse | null> {
        const result = await client.request<FinalizeTaskResponse>(`/tasks/${taskId}/finalize`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success && result.data) {
            return result.data;
        }

        console.error('[TasksService] finalizeTask failed:', result.error);
        return null;
    },

    /**
     * Get task status — useful for polling async tasks.
     */
    async getTask(
        client: IAPIClient,
        taskId: string
    ): Promise<TaskStatusResponse | null> {
        const result = await client.request<TaskStatusResponse>(`/tasks/${taskId}`);

        if (result.success && result.data) {
            return result.data;
        }

        return null;
    },

    /**
     * Send a heartbeat to prevent the server reconciliation cron from
     * timing out an active long-running task (>4 hours).
     */
    async heartbeat(client: IAPIClient, taskId: string): Promise<void> {
        await client.request(`/tasks/${taskId}/heartbeat`, { method: 'POST', body: '{}' });
    },
};

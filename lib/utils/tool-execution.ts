/**
 * Tool Execution Utility
 * Handles permission checks, credit deduction, and task creation
 */

import { apiClient } from '@/lib/api/client';
import { indexedDBService } from '@/lib/services/indexed-db.service';
import { STORES, type Task } from '@/lib/db/schema';

export interface RunToolOptions {
    toolId: string;
    toolName: string;
    marketplace: string;
    urls: string[];
    userId: string;
    onProgress?: (status: string) => void;
}

export interface RunToolResult {
    success: boolean;
    task?: Task;
    error?: string;
    errorCode?: string;
    upgradeUrl?: string;
}

/**
 * Run a tool with server-side permission check and client-side task creation
 */
export async function runTool(options: RunToolOptions): Promise<RunToolResult> {
    const { toolId, toolName, marketplace, urls, userId, onProgress } = options;

    try {
        onProgress?.('Checking permissions...');

        // 1. Check permission & deduct credits (server-side)
        const permission = await apiClient.checkPermission({
            action: 'run_tool',
            toolId,
            urlCount: urls.length,
        });

        if (!permission?.allowed) {
            return {
                success: false,
                error: permission?.reason || 'Permission denied',
                errorCode: permission?.code,
                upgradeUrl: permission?.upgradeUrl || permission?.purchaseUrl,
            };
        }

        onProgress?.('Creating task...');

        // 2. Create task in IndexedDB (client-side)
        const task: Task = {
            id: permission.taskId!, // Server-generated ID
            userId,
            toolId,
            toolName,
            marketplace,
            urlCount: urls.length,
            status: 'processing',
            creditsUsed: permission.creditsDeducted || 0,
            inputData: { urls, marketplace },
            createdAt: new Date().toISOString(),
            urls,
            processedAt: new Date().toISOString(),
        };

        await indexedDBService.put(STORES.TASKS, task);

        onProgress?.('Task created successfully');

        return {
            success: true,
            task,
        };
    } catch (error: any) {
        console.error('[runTool] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to run tool',
        };
    }
}

/**
 * Update task status and results
 */
export async function updateTaskStatus(
    taskId: string,
    status: Task['status'],
    outputData?: any,
    error?: string
): Promise<void> {
    try {
        const task = await indexedDBService.getById<Task>(STORES.TASKS, taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const updates: Partial<Task> = {
            status,
            outputData,
            error,
        };

        if (status === 'completed' || status === 'failed') {
            updates.completedAt = new Date().toISOString();
        }

        const updatedTask = { ...task, ...updates };
        await indexedDBService.put(STORES.TASKS, updatedTask);
    } catch (error) {
        console.error('[updateTaskStatus] Error:', error);
        throw error;
    }
}

/**
 * Check if user has permission for a feature
 */
export async function checkFeaturePermission(
    feature: 'schedules' | 'exports' | 'integrations' | 'webhooks'
): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeUrl?: string;
    maxLimit?: number | string;
}> {
    try {
        console.log(`[checkFeaturePermission] Checking permission for feature: ${feature}`);

        const features = await apiClient.getAvailableFeatures();
        if (!features) {
            console.error('[checkFeaturePermission] Failed to load features from API');
            return {
                allowed: false,
                reason: 'Failed to load feature permissions',
            };
        }

        console.log(`[checkFeaturePermission] Loaded features:`, {
            plan: features.plan,
            availableFeatures: Object.keys(features.features),
        });

        const featureData = features.features[feature];
        console.log(`[checkFeaturePermission] Feature "${feature}" data:`, featureData);

        if (!featureData || !featureData.enabled) {
            console.warn(`[checkFeaturePermission] Feature "${feature}" not enabled or not found`);
            return {
                allowed: false,
                reason: `${feature.charAt(0).toUpperCase() + feature.slice(1)} require a Pro plan or higher`,
                upgradeUrl: '/pricing',
            };
        }

        console.log(`[checkFeaturePermission] Feature "${feature}" is enabled, maxLimit:`, featureData.max || featureData.maxPerMonth);

        return {
            allowed: true,
            maxLimit: featureData.max || featureData.maxPerMonth,
        };
    } catch (error: any) {
        console.error('[checkFeaturePermission] Error:', error);
        return {
            allowed: false,
            reason: error.message || 'Failed to check permissions',
        };
    }
}

/**
 * Check local count against server limit for schedules/exports
 */
export async function checkLocalLimit(
    storeName: typeof STORES.SCHEDULES | typeof STORES.EXPORTS,
    maxLimit: number | string | undefined,
    filterFn?: (item: any) => boolean
): Promise<{
    allowed: boolean;
    current: number;
    max: number | string;
    remaining: number | string;
}> {
    try {
        console.log(`[checkLocalLimit] Checking limit for store: ${storeName}, maxLimit: ${maxLimit}`);

        let items = await indexedDBService.getAll(storeName);

        // Apply filter if provided
        if (filterFn) {
            items = items.filter(filterFn);
        }

        const current = items.length;
        console.log(`[checkLocalLimit] Current count in ${storeName}: ${current}`);

        if (maxLimit === 'unlimited' || maxLimit === undefined) {
            console.log(`[checkLocalLimit] Limit is unlimited`);
            return {
                allowed: true,
                current,
                max: 'unlimited',
                remaining: 'unlimited',
            };
        }

        const max = typeof maxLimit === 'number' ? maxLimit : parseInt(maxLimit);
        const remaining = Math.max(0, max - current);
        const allowed = current < max;

        console.log(`[checkLocalLimit] Result: allowed=${allowed}, current=${current}, max=${max}, remaining=${remaining}`);

        return {
            allowed,
            current,
            max,
            remaining,
        };
    } catch (error) {
        console.error('[checkLocalLimit] Error:', error);
        return {
            allowed: false,
            current: 0,
            max: 0,
            remaining: 0,
        };
    }
}

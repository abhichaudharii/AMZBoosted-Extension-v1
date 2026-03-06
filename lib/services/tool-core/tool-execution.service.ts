import { apiClient } from '@/lib/api/client';
import { creditsService } from '../credits.service';
import { analyticsService } from '../analytics.service';
import { TaskLogger } from '../logging.service';
import { updateTaskStatus } from '@/lib/utils/tool-execution';
import { indexedDBService } from '../indexed-db.service';
import { STORES, type Task } from '@/lib/db/schema';
import { notificationService } from '../notification.service';
import { downloadService } from '../download.service';
import { enrichSQPData } from '@/lib/services/tools/sqp-universal.service';
import { generateExcel } from '@/lib/utils/excel';

import { ToolExecutionProgress, ToolRunConfig, ToolRunResult } from '@/lib/types/tool-execution';

// Core services
import { toolBrowserService } from './tool-browser.service';
import { toolDataService } from './tool-data.service';
import { toolBackgroundService } from './tool-background.service';
import { toolDriveService } from './tool-drive.service';

export class ToolExecutionService {
    private activeRuns = new Map<string, {
        toolId: string;
        startTime: number;
        progress: ToolExecutionProgress;
        status: 'running' | 'paused' | 'completed' | 'failed';
        transactionId?: string;
    }>();

    /**
     * Get active run state for a tool
     */
    getActiveRun(toolId: string) {
        // Find any active run for this tool
        for (const [runId, state] of this.activeRuns.entries()) {
            if (state.toolId === toolId && state.status === 'running') {
                return {
                    runId,
                    ...state
                };
            }
        }
        return null;
    }

    /**
     * Emit progress update for a task
     */
    emitProgress(taskId: string, progress: ToolExecutionProgress) {
        const run = this.activeRuns.get(taskId);
        if (run) {
            run.progress = progress;
            this.activeRuns.set(taskId, run);
        }
    }

    /**
     * Check if a tool run is active
     */
    isRunActive(runId: string): boolean {
        return this.activeRuns.has(runId);
    }

    /**
     * Cancel a tool run
     */
    async cancelRun(runId: string): Promise<void> {
        this.activeRuns.delete(runId);
        // Note: Backend should also be notified to stop processing
    }

    /**
     * Execute a tool with permission checking and backend integration
     */
    async executeTool(config: ToolRunConfig): Promise<ToolRunResult> {
        let { toolId, toolName, marketplace, urls, options } = config;

        console.log(`[Tool] Executing ${toolName} with ${urls.length} URLs`);

        // 1. Validate inputs
        if ((!urls || urls.length === 0) && toolId !== 'sales-traffic-drilldown') {
            return {
                success: false,
                error: 'No URLs provided',
            };
        }

        // Deduplicate URLs/ASINs
        urls = [...new Set(urls)];

        // 2. Check permission with backend
        let checkUrlCount = urls.length;
        if (toolId === 'sales-traffic-drilldown' && checkUrlCount === 0) {
            checkUrlCount = 1;
        }

        const permission = await apiClient.checkPermission({
            action: 'run_tool',
            toolId,
            urlCount: checkUrlCount,
        });

        if (!permission.allowed) {
            console.log(`[Tool] Permission denied: ${permission.reason}`);
            return {
                success: false,
                error: permission.reason || 'Permission denied',
            };
        }

        // 3. Permission granted - backend created task and deducted credits
        const taskId = permission.taskId!;

        // Initialize active run state
        this.activeRuns.set(taskId, {
            toolId,
            startTime: Date.now(),
            progress: { total: urls.length, completed: 0, failed: 0 },
            status: 'running',
            transactionId: permission.transactionId
        });

        console.log(`[Tool] Permission granted. Task ID: ${taskId}, Credits deducted: ${permission.creditsDeducted}`);

        // 3a. Create task in IndexedDB
        const task: Task = {
            id: taskId,
            userId: '', // Will be set by backend
            toolId,
            toolName,
            marketplace,
            urlCount: urls.length,
            status: 'processing',
            creditsUsed: permission.creditsDeducted || 0,
            inputData: {
                urls,
                marketplace,
                options,
                triggeredBy: 'manual',
            },
            createdAt: new Date().toISOString(),
            urls,
            processedAt: new Date().toISOString(),
        };

        await indexedDBService.put(STORES.TASKS, task);

        // Create logger for this task
        const logger = new TaskLogger(taskId);
        logger.info('Task started', {
            toolId,
            toolName,
            marketplace,
            urlCount: urls.length,
            creditsDeducted: permission.creditsDeducted,
            bypassCreditCheck: options?.bypassCreditCheck
        });

        // Track tool run start
        await analyticsService.trackToolRun({
            toolId,
            toolName,
            marketplace,
            urlCount: urls.length,
            startTime: new Date().toISOString(),
            status: 'running',
            delay: options?.delay || 0,
            creditsUsed: permission.creditsDeducted || 0,
        });

        try {
            // 4. Execute tool logic
            if (toolBackgroundService.isBackgroundTool(toolId, toolName)) {
                return this.executeBackgroundTool(toolId, taskId, permission.creditsDeducted || 0, urls, options, marketplace, toolName);
            }

            // Standard tool execution (Legacy / Other tools)
            const results = await toolBrowserService.processUrls(toolId, urls, marketplace, options || {}, logger, (progress) => {
                this.emitProgress(taskId, progress);
            });

            // 5. Calculate actual credits used
            const actualCreditsUsed = permission.creditsDeducted || 0;

            // 5b. Update task with results in IndexedDB
            await updateTaskStatus(
                taskId,
                results.errors.length === urls.length ? 'failed' : 'completed',
                {
                    successful: results.data.length,
                    failed: results.errors.length,
                    summary: toolDataService.calculateSummary(results.data),
                    data: results.data,
                    errors: results.errors,
                }
            );

            // 6. Refresh credits
            await creditsService.refresh();

            // Track completion
            await analyticsService.trackToolRun({
                toolId,
                toolName,
                marketplace,
                urlCount: urls.length,
                startTime: new Date().toISOString(),
                status: results.data.length > 0 ? 'completed' : 'failed',
                delay: options?.delay || 0,
                creditsUsed: actualCreditsUsed,
            });

            logger.info('Task completed', {
                successful: results.data.length,
                failed: results.errors.length,
                creditsUsed: actualCreditsUsed,
            });

            // 7. Send completion notification
            const duration = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 1000);
            await notificationService.notifyToolComplete({
                toolName,
                urlCount: urls.length,
                successCount: results.data.length,
                errorCount: results.errors.length,
                duration,
            });

            // 8. Auto-download results if successful
            if (results.data.length > 0) {
                await downloadService.downloadTaskResults({
                    taskId,
                    toolId,
                    toolName,
                    marketplace,
                    data: results.data,
                    source: 'quick_run',
                    format: 'csv', // Simple format
                });
            }

            this.activeRuns.delete(taskId);

            return {
                success: results.data.length > 0,
                runId: taskId,
                results: results.data,
                errors: results.errors,
                creditsUsed: actualCreditsUsed,
            };
        } catch (error) {
            console.error('[Tool] Execution failed:', error);
            const errorMessage = error instanceof Error ? error.message :
                typeof error === 'object' ? JSON.stringify(error) : String(error);

            logger.error('Task failed', { error: errorMessage });

            // Mark task as failed in IndexedDB
            await updateTaskStatus(taskId, 'failed', undefined, errorMessage);

            this.activeRuns.delete(taskId);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Execute a tool WITHOUT permission checking
     */
    async executeToolWithoutPermissionCheck(
        config: ToolRunConfig,
        taskId: string,
        creditsDeducted: number,
        transactionId?: string
    ): Promise<ToolRunResult> {
        const { toolId, toolName, marketplace, urls, options } = config;

        console.log(`[Tool] Executing ${toolName} (permission pre-checked) with ${urls.length} URLs`);

        // 1. Validate inputs
        if ((!urls || urls.length === 0) && toolId !== 'sales-traffic-drilldown') {
            return {
                success: false,
                error: 'No URLs provided',
            };
        }

        this.activeRuns.set(taskId, {
            toolId,
            startTime: Date.now(),
            progress: { total: urls.length, completed: 0, failed: 0 },
            status: 'running',
            transactionId
        });

        // Create logger for this task
        const logger = new TaskLogger(taskId);
        logger.info('Task started (from schedule)', {
            toolId,
            toolName,
            marketplace,
            urlCount: urls.length,
            creditsDeducted,
        });

        try {
            // 2. Execute tool logic
            if (toolBackgroundService.isBackgroundTool(toolId, toolName)) {

                // Check if we are running in the background service worker
                const isBackground = typeof window === 'undefined';
                let result: any = { results: [], errors: [] };

                if (isBackground) {
                    // DIRECT EXECUTION (Background context)
                    console.log(`[Tool] Running ${toolId} directly in background context`);
                    result = await toolBackgroundService.executeBackgroundToolDirect(toolId, taskId, urls, options, marketplace, (progress) => {
                        this.emitProgress(taskId, progress);
                    }, toolName);
                } else {
                    // DELEGATE TO BACKGROUND (Sidepanel context)
                    result = await toolBackgroundService.executeBackgroundToolDelegated(toolId, taskId, urls, options, marketplace, toolName);
                }

                // Process results
                let results = result?.results || [];
                const errors = result?.errors || [];

                // Enrich data with calculated metrics ONLY for SQP tools
                if (toolId === 'sqr-simple' || toolId === 'sqr-detail') {
                    results = enrichSQPData(results);
                }

                const isSuccess = errors.length === 0;
                const actualCreditsUsed = isSuccess ? (creditsDeducted || 0) : 0;
                const processedCount = result?.processedCount !== undefined ? result.processedCount : results.length;
                const successfulCount = result?.successful !== undefined ? result.successful : processedCount;
                const failedCount = result?.failed !== undefined ? result.failed : errors.length;

                const statusMessage = isSuccess && results.length === 0 ? 'No data found for the selected criteria.' : undefined;

                await updateTaskStatus(
                    taskId,
                    isSuccess ? 'completed' : 'failed',
                    {
                        successful: successfulCount,
                        failed: failedCount,
                        summary: {
                            totalProcessed: processedCount,
                            timestamp: new Date().toISOString(),
                            message: statusMessage
                        },
                        data: results,
                        errors: errors,
                    },
                    !isSuccess ? errors[0] : undefined
                );

                // If failed, refund credits
                if (!isSuccess && creditsDeducted > 0) {
                    // SERVER-SIDE REFUND: Server handles refunds based on task failure status
                    logger.info('Task failed, server should handle refund', { amount: creditsDeducted });
                }

                // Google Drive Upload (BACKGROUND CONTEXT ONLY)
                if (isBackground && options.googleDriveEnabled && results && results.length > 0) {
                    await toolDriveService.uploadToDrive(toolName, toolId, marketplace, results, options, taskId, config);
                }

                this.activeRuns.delete(taskId);

                return {
                    success: isSuccess,
                    runId: taskId,
                    results: results,
                    errors: errors,
                    creditsUsed: actualCreditsUsed,
                    processedCount: processedCount
                };
            }

            // Standard tool execution (Legacy / Other tools)
            const results = await toolBrowserService.processUrls(toolId, urls, marketplace, options || {}, logger, (progress) => {
                this.emitProgress(taskId, progress);
            });

            // Calculate actual credits used
            const actualCreditsUsed = results.data.length;
            const allFailed = results.errors.length === urls.length;
            const taskStatus = allFailed ? 'failed' : 'completed';

            // If some URLs failed, refund the unused credits (logging only)
            if (actualCreditsUsed < creditsDeducted) {
                const refundAmount = creditsDeducted - actualCreditsUsed;
                logger.info('Partial failure, server should handle partial refund', {
                    deducted: creditsDeducted,
                    successful: actualCreditsUsed,
                    refunding: refundAmount,
                });
            }

            // Update task with results in IndexedDB
            await updateTaskStatus(
                taskId,
                taskStatus,
                {
                    successful: results.data.length,
                    failed: results.errors.length,
                    summary: toolDataService.calculateSummary(results.data),
                    data: results.data,
                    errors: results.errors,
                }
            );

            logger.info(`Task ${taskStatus}`, {
                successful: results.data.length,
                failed: results.errors.length,
                creditsUsed: actualCreditsUsed,
            });

            // Auto-download results if successful
            if (results.data.length > 0) {
                const source: any = config.triggeredBy === 'manual' ? 'manual_schedule' :
                    config.triggeredBy === 'auto' ? 'auto_schedule' : 'quick_run';

                await downloadService.downloadTaskResults({
                    taskId,
                    toolId,
                    toolName,
                    marketplace,
                    data: results.data,
                    source,
                    scheduleName: config.scheduleName,
                    format: 'csv',
                });
            }

            this.activeRuns.delete(taskId);

            return {
                success: results.data.length > 0,
                runId: taskId,
                results: results.data,
                errors: results.errors,
                creditsUsed: actualCreditsUsed,
            };

        } catch (error) {
            console.error('[Tool] Execution failed:', error);
            const errorMessage = error instanceof Error ? error.message :
                typeof error === 'object' ? JSON.stringify(error) : String(error);

            logger.error('Task failed', { error: errorMessage });

            // Update task with error
            await updateTaskStatus(taskId, 'failed', undefined, errorMessage);

            // Refund all credits
            if (creditsDeducted > 0) {
                logger.info('Task execution failed, server should handle refund', { refunded: creditsDeducted });
            }

            this.activeRuns.delete(taskId);

            return {
                success: false,
                runId: taskId,
                error: errorMessage,
                creditsUsed: 0,
            };
        }
    }

    private async executeBackgroundTool(
        toolId: string,
        taskId: string,
        creditsDeducted: number,
        urls: string[],
        options: any,
        marketplace: string,
        toolName: string
    ) {

        // Use delegated execution logic from service
        // But executeTool logic usually runs in UI context, so it delegates to background anyway
        // The original logic here was sending a message to background.
        // toolBackgroundService.executeBackgroundToolDelegated does exactly that.

        let result: any;
        try {
            result = await toolBackgroundService.executeBackgroundToolDelegated(toolId, taskId, urls, options, marketplace);
        } catch (e: any) {
            throw new Error(e.message || 'Failed to execute background tool');
        }

        let results = result?.results || [];
        const errors = result?.errors || [];

        // Skip for category-insights etc as they handle their own download (retained logic)
        const skipDownloadTools = ['category-insights', 'asin-x', 'product-niche-metrics', 'niche-x', 'niche-query-pulse', 'sales-traffic-drilldown', 'price-tracker'];
        if (results.length > 0 && !skipDownloadTools.includes(toolId)) {

            if (toolId === 'sqr-simple' || toolId === 'sqr-detail') {
                results = enrichSQPData(results);
            }

            const format = options?.outputFormat || 'excel';
            const exportData = toolDataService.generateExport(results, format === 'excel' || format === 'xlsx' ? 'csv' : format);

            let preGeneratedContent: any = exportData.content;
            let mimeType = exportData.mimeType;
            let extension = exportData.extension;

            if (format === 'excel' || format === 'xlsx') {
                const excelData = generateExcel(results);
                preGeneratedContent = excelData.content;
                mimeType = excelData.mimeType;
                extension = excelData.extension;
            }

            await downloadService.downloadTaskResults({
                taskId,
                toolId,
                toolName,
                marketplace,
                data: results,
                source: 'quick_run',
                format: extension as any,
                preGeneratedContent: preGeneratedContent,
                mimeType: mimeType
            });
        }

        const hasErrors = errors.length > 0;
        const isSuccess = !hasErrors;
        const actualCreditsUsed = isSuccess ? (creditsDeducted || 0) : 0;
        const taskStatus = isSuccess ? 'completed' : 'failed';
        const statusMessage = !hasErrors && results.length === 0 ? 'No data found for the selected criteria.' : undefined;
        const processedCount = result?.processedCount !== undefined ? result.processedCount : results.length;

        await updateTaskStatus(
            taskId,
            taskStatus,
            {
                successful: processedCount,
                failed: errors.length,
                summary: {
                    totalProcessed: processedCount,
                    timestamp: new Date().toISOString(),
                    message: statusMessage
                },
                data: results,
                errors: errors,
            },
            hasErrors ? errors[0] : undefined
        );

        await analyticsService.trackToolRun({
            toolId,
            toolName,
            marketplace,
            urlCount: urls.length,
            startTime: new Date().toISOString(),
            status: taskStatus,
            delay: options?.delay || 0,
            creditsUsed: actualCreditsUsed,
        });

        this.activeRuns.delete(taskId);

        return {
            success: isSuccess,
            runId: taskId,
            results: results,
            errors: errors,
            creditsUsed: actualCreditsUsed,
            processedCount: processedCount,
            error: hasErrors ? errors[0] : undefined
        };
    }
}

export const toolExecutionService = new ToolExecutionService();

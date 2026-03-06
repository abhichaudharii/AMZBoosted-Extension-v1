/**
 * Scheduler Service
 * Manages automatic execution of scheduled tool runs using Chrome alarms
 */

import { apiClient } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secure-storage';
import { indexedDBService } from './indexed-db.service';
import { toolService } from './tool.service';
import { authService } from './auth.service';

import { creditsService } from './credits.service';
import { notificationService } from './notification.service';
import { STORES, type Schedule, type Task } from '@/lib/db/schema';
import { sendNotification } from '@/lib/api/services/notifications';

import { checkAccess } from '@/lib/utils/access-control';

const CHECK_INTERVAL = 1; // Check every 1 minute
const RETRY_DELAY_MS = 60 * 60 * 1000; // Retry after 1 hour if auth fails

export interface ScheduleRunResult {
    success: boolean;
    scheduleId: string;
    runId?: string;
    taskId?: string;
    creditsUsed?: number;
    urlsProcessed?: number;
    errors?: string[];
    reason?: string;
}

class SchedulerService {
    private isInitialized = false;
    private activeRuns = new Map<string, boolean>();
    private tools: any[] = [];

    /**
     * Initialize the scheduler service
     * Called from background script on extension load
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('[Scheduler] Already initialized');
            return;
        }

        console.log('[Scheduler] Initializing...');

        // Fetch tools configuration
        try {
            this.tools = await apiClient.getTools() || [];
            console.log(`[Scheduler] Loaded ${this.tools.length} tools`);
        } catch (e) {
            console.warn('[Scheduler] Failed to load tools config:', e);
        }

        // Set up alarm listener
        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'schedule_check') {
                this.checkScheduledTasks();
            }
        });

        // Create periodic alarm to check for scheduled tasks
        await chrome.alarms.create('schedule_check', {
            periodInMinutes: CHECK_INTERVAL,
        });

        // Run initial check
        await this.checkScheduledTasks();

        this.isInitialized = true;
        console.log('[Scheduler] Initialized successfully');
    }

    /**
     * Check for scheduled tasks that need to run
     */
    private async checkScheduledTasks(): Promise<void> {
        try {
            console.log('[Scheduler] Checking for scheduled tasks...');

            // Get all enabled schedules from IndexedDB
            const schedules = await indexedDBService.getAllSchedules();
            const enabledSchedules = schedules.filter((s) => s.enabled);

            if (enabledSchedules.length === 0) return;

            console.log(`[Scheduler] Found ${enabledSchedules.length} enabled schedules`);

            // --- PROACTIVE SUBSCRIPTION CHECK ---
            const result = await secureStorage.get('subscriptionStatus');
            const status = result.subscriptionStatus;
            // If we can't get the status or access is denied, disable ALL enabled schedules
            const { allowed, reason: accessReason } = checkAccess(status);

            if (!allowed) {
                console.log(`[Scheduler] Access denied (${accessReason}). Disabling ${enabledSchedules.length} schedules.`);

                for (const schedule of enabledSchedules) {
                    // Disable schedule
                    await indexedDBService.updateSchedule(schedule.id, {
                        enabled: false,
                        status: 'paused',
                        lastRunAt: new Date().toISOString() // Mark so we know when it was stopped
                    });

                    const reason = `Schedule disabled: ${accessReason || 'Subscription Required'}`;

                    // Log failed task to Activity for visibility
                    await this.createFailedTask(schedule, 'auto', reason);

                    // Show Notification
                    await notificationService.show({
                        type: 'error',
                        title: 'Schedule Paused',
                        message: `"${schedule.name}" was paused because your ${accessReason === 'no_plan' ? 'trial' : 'subscription'} has ended.`,
                        requireInteraction: true,
                        actionLabel: 'Restore Access',
                        actionUrl: '/dashboard.html#/billing',
                    });
                }
                return; // Stop processing
            }
            // -------------------------------------

            const now = new Date();

            for (const schedule of enabledSchedules) {
                // Skip if already running
                if (this.activeRuns.has(schedule.id)) {
                    console.log(`[Scheduler] Schedule ${schedule.id} is already running, skipping`);
                    continue;
                }

                // Check if schedule should run now
                const shouldRun = this.shouldRunNow(schedule, now);
                console.log(`[Scheduler] Schedule ${schedule.id}: shouldRun=${shouldRun}, nextRunAt=${schedule.nextRunAt}, lastRunAt=${schedule.lastRunAt}, time=${schedule.time}`);

                if (shouldRun) {
                    console.log(`[Scheduler] Schedule ${schedule.id} should run now`);
                    await this.executeSchedule(schedule, 'auto');
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error checking scheduled tasks:', error);
        }
    }

    /**
     * Check if a schedule should run now
     */
    private shouldRunNow(schedule: Schedule, now: Date): boolean {


        // Check if nextRunAt is set and has passed
        if (schedule.nextRunAt) {
            const nextRun = new Date(schedule.nextRunAt);
            const isPast = now >= nextRun;
            console.log(`[Scheduler] Checking nextRunAt: ${nextRun.toISOString()} vs Now: ${now.toISOString()} -> isPast: ${isPast}`);
            if (isPast) {
                return true;
            }
        }

        // Check based on frequency and time
        return this.matchesScheduleTime(schedule, now);
    }

    /**
     * Check if current time matches schedule configuration
     */
    private matchesScheduleTime(schedule: Schedule, now: Date): boolean {
        // Parse schedule time (HH:MM format)
        const [targetHour, targetMinute] = schedule.time.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Allow 1-minute window for matching
        const timeMatches =
            currentHour === targetHour && Math.abs(currentMinute - targetMinute) <= 1;

        if (!timeMatches) {
            return false;
        }

        // Check frequency-specific conditions
        switch (schedule.frequency) {
            case 'daily':
                return true;

            case 'weekly': {
                // Check if cron expression exists for day of week
                if (schedule.cronExpression) {
                    // Simple day check (0 = Sunday, 6 = Saturday)
                    const dayOfWeek = now.getDay();
                    // cronExpression format: "minute hour * * dayOfWeek"
                    const cronParts = schedule.cronExpression.split(' ');
                    if (cronParts.length >= 5) {
                        const cronDayOfWeek = cronParts[4];
                        return cronDayOfWeek === '*' || cronDayOfWeek === String(dayOfWeek);
                    }
                }
                return false;
            }

            case 'monthly': {
                // Check if cron expression exists for day of month
                if (schedule.cronExpression) {
                    const dayOfMonth = now.getDate();
                    // cronExpression format: "minute hour dayOfMonth * *"
                    const cronParts = schedule.cronExpression.split(' ');
                    if (cronParts.length >= 5) {
                        const cronDayOfMonth = cronParts[2];
                        return cronDayOfMonth === '*' || cronDayOfMonth === String(dayOfMonth);
                    }
                }
                return false;
            }

            default:
                return false;
        }
    }

    /**
     * Execute a scheduled task
     */
    async executeSchedule(
        schedule: Schedule,
        triggeredBy: 'auto' | 'manual'
    ): Promise<ScheduleRunResult> {
        const scheduleId = schedule.id;
        console.log(`[Scheduler] executeSchedule called for ${scheduleId} (${triggeredBy})`);

        this.activeRuns.set(scheduleId, true);

        console.log(`[Scheduler] Executing schedule ${scheduleId} (${triggeredBy})`);

        const startTime = Date.now();

        try {
            // 0. Check Authentication First
            const isAuthenticated = await authService.isAuthenticated();
            if (!isAuthenticated) {
                const reason = 'User not logged in';
                console.log(`[Scheduler] ${reason}, scheduling retry.`);
                // ... (existing auth check logic) ...
            }

            // 0.5 Check Subscription Status (Strict Access Control)
            // Get latest user data first to ensure we have up-to-date plan info
            const { user } = await secureStorage.get('user');
            const { allowed, reason: accessReason } = checkAccess(user);

            if (!allowed) {
                const reason = `Access Denied: ${accessReason || 'No Active Plan'}`;
                console.log(`[Scheduler] ${reason}. Disabling schedule.`);

                // Disable schedule immediately
                await indexedDBService.updateSchedule(scheduleId, {
                    lastRunAt: new Date().toISOString(),
                    enabled: false,
                });

                // Log failed task to Activity
                await this.createFailedTask(schedule, triggeredBy, reason);

                // Show Notification
                await notificationService.show({
                    type: 'error',
                    title: 'Schedule Access Restricted',
                    message: `To run "${schedule.name}", please activate your plan or trial.`,
                    requireInteraction: true,
                    actionLabel: 'Upgrade Plan',
                    actionUrl: '/dashboard.html#/billing',
                });

                this.activeRuns.delete(scheduleId);
                return { success: false, scheduleId, reason };
            }

            // 1. Check permission and deduct credits via backend
            // ...

            // 1. Check permission and deduct credits via backend
            const permissionResult = await apiClient.startScheduleRun({
                scheduleId,
                toolId: schedule.toolId,
                marketplace: schedule.marketplace,
                urlCount: schedule.urls.length,
                triggeredBy,
            });

            if (!permissionResult.success) {
                console.log(`[Scheduler] Permission denied for schedule ${scheduleId}:`, permissionResult.reason);

                // Log failed task to Activity
                await this.createFailedTask(schedule, triggeredBy, permissionResult.reason || 'Permission denied');

                // Update schedule status
                // If it's an auth error from backend (despite local check), retry. Otherwise disable.
                const isAuthError = permissionResult.reason?.toLowerCase().includes('auth') ||
                    permissionResult.reason?.toLowerCase().includes('token') ||
                    permissionResult.reason?.toLowerCase().includes('session');

                if (isAuthError) {
                    const currentRetryCount = schedule.retryCount || 0;
                    if (currentRetryCount < 3) {
                        const retryTime = new Date(Date.now() + RETRY_DELAY_MS);
                        await indexedDBService.updateSchedule(scheduleId, {
                            lastRunAt: new Date().toISOString(),
                            nextRunAt: retryTime.toISOString(),
                            retryCount: currentRetryCount + 1
                        });
                    } else {
                        await indexedDBService.updateSchedule(scheduleId, {
                            lastRunAt: new Date().toISOString(),
                            enabled: false,
                            retryCount: 0
                        });
                        await notificationService.show({
                            type: 'error',
                            title: 'Schedule Disabled',
                            message: `"${schedule.name}" disabled after 3 failed attempts (Backend Auth).`,
                            requireInteraction: true,
                        });
                    }
                } else {
                    // Non-auth error (e.g. no credits) - disable immediately
                    await indexedDBService.updateSchedule(scheduleId, {
                        lastRunAt: new Date().toISOString(),
                        enabled: false,
                    });

                    await notificationService.show({
                        type: 'error',
                        title: 'Scheduled Run Failed',
                        message: permissionResult.reason || 'Permission denied',
                        requireInteraction: true,
                        actionLabel: 'View Schedule',
                        actionUrl: `/schedules/${scheduleId}`,
                    });
                }

                this.activeRuns.delete(scheduleId);

                return {
                    success: false,
                    scheduleId,
                    reason: permissionResult.reason,
                };
            }

            const { runId, taskId, creditsDeducted } = permissionResult;

            console.log(`[Scheduler] Permission granted. RunId: ${runId}, Credits deducted: ${creditsDeducted}`);

            // 2. Create task in IndexedDB (required for updateTaskStatus to work)
            const task: Task = {
                id: runId!,
                userId: '', // Will be set by backend
                toolId: schedule.toolId,
                toolName: this.tools.find(t => t.id === schedule.toolId)?.name || schedule.name,
                marketplace: schedule.marketplace,
                urlCount: schedule.urls.length,
                status: 'processing',
                creditsUsed: creditsDeducted || 0,
                inputData: {
                    urls: schedule.urls,
                    marketplace: schedule.marketplace,
                    scheduleId,
                    triggeredBy, // Store triggeredBy flag for display in Activity page
                    options: schedule.options // Store options in task input data too
                },
                createdAt: new Date().toISOString(),
                urls: schedule.urls,
                processedAt: new Date().toISOString(),
            };

            await indexedDBService.put(STORES.TASKS, task);

            // 3. Execute the tool (without permission check - already done above)
            // Prepare options - handle dynamic data period
            const runOptions = {
                ...(schedule.options || {}),
                marketplace: schedule.marketplace, // Ensure marketplace is passed in options for tools that need it
                outputFormat: schedule.outputFormat // Ensure output format is passed
            };

            // If dataPeriod is set (e.g. 'current_week'), clear specific weeks so tool fetches latest
            if (schedule.dataPeriod) {
                runOptions.weeks = [];
                console.log(`[Scheduler] dataPeriod is ${schedule.dataPeriod}, clearing weeks to fetch latest.`);

                // For Sales & Traffic Drilldown: Calculate Date Range
                if (schedule.toolId === 'sales-traffic-drilldown') {
                    if (schedule.dataPeriod === 'custom') {
                        if (schedule.options?.startDate && schedule.options?.endDate) {
                            runOptions.startDate = schedule.options.startDate;
                            runOptions.endDate = schedule.options.endDate;
                            console.log(`[Scheduler] Using custom date range: ${runOptions.startDate} to ${runOptions.endDate}`);
                        }
                    } else {
                        const today = new Date();
                        const start = new Date();
                        const end = new Date(); // default to now

                        // Helper to format YYYY-MM-DD
                        const fmt = (d: Date) => d.toISOString().split('T')[0];

                        let calculated = false;

                        switch (schedule.dataPeriod) {
                            case 'yesterday':
                                start.setDate(today.getDate() - 1);
                                end.setDate(today.getDate() - 1);
                                calculated = true;
                                break;
                            case 'last_7_days':
                                start.setDate(today.getDate() - 7);
                                end.setDate(today.getDate() - 1);
                                calculated = true;
                                break;
                            case 'last_30_days':
                                start.setDate(today.getDate() - 30);
                                end.setDate(today.getDate() - 1);
                                calculated = true;
                                break;
                            case 'month_to_date':
                                start.setDate(1); // 1st of current month
                                end.setDate(today.getDate() - 1); // up to yesterday
                                if (start > end) {
                                    start.setMonth(start.getMonth() - 1);
                                    start.setDate(1);
                                    end.setDate(0);
                                }
                                calculated = true;
                                break;
                            case 'last_month':
                                start.setMonth(start.getMonth() - 1);
                                start.setDate(1);
                                end.setDate(0);
                                calculated = true;
                                break;
                        }

                        if (calculated) {
                            runOptions.startDate = fmt(start);
                            runOptions.endDate = fmt(end);
                            console.log(`[Scheduler] Calculated dynamic date range for ${schedule.dataPeriod}: ${runOptions.startDate} to ${runOptions.endDate}`);
                        }
                    }
                }
            }

            // Notify Start (API)
            if (schedule.options?.notifyOnStart) {
                sendNotification({
                    message: `🚀 Schedule Started: "${schedule.name}" is processing ${schedule.urls.length} items.`,
                    channels: schedule.options?.notificationChannels || ['all']
                }).catch(err => console.error('[Scheduler] Failed to send start notification', err));
            }

            const toolResult = await toolService.executeToolWithoutPermissionCheck(
                {
                    toolId: schedule.toolId,
                    toolName: this.tools.find(t => t.id === schedule.toolId)?.name || schedule.name,
                    marketplace: schedule.marketplace,
                    urls: schedule.urls,
                    options: runOptions,
                    scheduleName: schedule.name,
                    triggeredBy,
                },
                runId!, // Use runId as taskId
                creditsDeducted || 0
            );

            const duration = Date.now() - startTime;

            // 3. Complete the run on backend
            await apiClient.completeScheduleRun({
                runId: runId!,
                scheduleId,
                success: toolResult.success,
                results: toolResult.results,
                errors: toolResult.errors,
                urlsProcessed: toolResult.results?.length || 0,
                duration,
            });

            // 4. Track analytics (use actual credits used, not initially deducted)
            await apiClient.trackScheduleExecution({
                scheduleId,
                toolId: schedule.toolId,
                marketplace: schedule.marketplace,
                urlCount: schedule.urls.length,
                triggeredBy,
                success: toolResult.success,
                duration,
                creditsUsed: toolResult.creditsUsed || 0, // Use actual credits from tool result
            });

            // 5. Update schedule in IndexedDB
            await indexedDBService.updateSchedule(scheduleId, {
                lastRunAt: new Date().toISOString(),
                nextRunAt: this.calculateNextRun(schedule).toISOString(),
                runCount: (schedule.runCount || 0) + 1,
                retryCount: 0 // Reset retry count on success
            });

            // 6. Refresh credits
            await creditsService.refresh();

            // 7. Send notification to user
            // 7. Send notification to user
            if (schedule.notifyOnComplete) {
                await notificationService.notifyScheduleComplete(
                    schedule.name,
                    toolResult.success,
                    toolResult.results?.length || 0
                );
            }

            this.activeRuns.delete(scheduleId);

            console.log(`[Scheduler] Schedule ${scheduleId} ${toolResult.success ? 'completed successfully' : 'completed with errors'}`);

            // Notify Success/Fail (API)
            if (toolResult.success) {
                if (schedule.options?.notifyOnSuccess) {
                    sendNotification({
                        message: `✅ Schedule Completed: "${schedule.name}" processed ${toolResult.results?.length || 0} items successfully.`,
                        channels: schedule.options?.notificationChannels || ['all']
                    }).catch(err => console.error('[Scheduler] Failed to send success notification', err));
                }
            } else {
                if (schedule.options?.notifyOnFail) {
                    sendNotification({
                        message: `❌ Schedule Failed: "${schedule.name}" completed with errors.`,
                        channels: schedule.options?.notificationChannels || ['all']
                    }).catch(err => console.error('[Scheduler] Failed to send failure notification', err));
                }
            }

            return {
                success: toolResult.success, // Return actual tool execution success status
                scheduleId,
                runId,
                taskId,
                creditsUsed: toolResult.creditsUsed || 0, // Use actual credits from tool result
                urlsProcessed: toolResult.results?.length || 0,
                errors: toolResult.errors,
            };
        } catch (error) {
            console.error(`[Scheduler] Error executing schedule ${scheduleId}:`, error);

            // Notify Fail (API) - Catch Block Loop
            if (schedule.options?.notifyOnFail) {
                sendNotification({
                    message: `❌ Schedule Failed: "${schedule.name}" encountered an error.`,
                    channels: schedule.options?.notificationChannels || ['all']
                }).catch(err => console.error('[Scheduler] Failed to send error notification', err));
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Log failed task to Activity
            await this.createFailedTask(schedule, triggeredBy, errorMessage);

            // Check if it's an Amazon Auth error
            const isAmazonAuthError =
                errorMessage.includes('Authentication failed') ||
                errorMessage.includes('Session expired') ||
                errorMessage.includes('log in');

            if (isAmazonAuthError) {
                console.log(`[Scheduler] Amazon auth failed for ${scheduleId}, scheduling retry.`);

                const currentRetryCount = schedule.retryCount || 0;
                if (currentRetryCount < 3) {
                    // Schedule Retry (1 hour later)
                    const retryTime = new Date(Date.now() + RETRY_DELAY_MS);
                    await indexedDBService.updateSchedule(scheduleId, {
                        lastRunAt: new Date().toISOString(),
                        nextRunAt: retryTime.toISOString(),
                        retryCount: currentRetryCount + 1
                    });
                } else {
                    // Max retries reached
                    await indexedDBService.updateSchedule(scheduleId, {
                        lastRunAt: new Date().toISOString(),
                        enabled: false,
                        retryCount: 0
                    });

                    await notificationService.show({
                        type: 'error',
                        title: 'Schedule Disabled',
                        message: `"${schedule.name}" disabled after 3 failed attempts (Amazon Auth).`,
                        requireInteraction: true,
                        actionLabel: 'Login to Amazon',
                        actionUrl: 'https://sellercentral.amazon.com',
                    });
                }
            } else {
                // Send generic error notification
                await notificationService.show({
                    type: 'error',
                    title: 'Schedule Failed',
                    message: `"${schedule.name}" failed: ${errorMessage}`,
                    requireInteraction: true,
                    actionLabel: 'View Activity',
                    actionUrl: '/activity',
                });

                // Update schedule (don't disable, just mark run)
                await indexedDBService.updateSchedule(scheduleId, {
                    lastRunAt: new Date().toISOString(),
                    nextRunAt: this.calculateNextRun(schedule).toISOString(),
                    retryCount: 0 // Reset retry count for non-auth errors
                });
            }

            this.activeRuns.delete(scheduleId);

            return {
                success: false,
                scheduleId,
                reason: errorMessage,
            };
        }
    }

    /**
     * Helper to create a failed task record in IndexedDB so it shows in Activity
     */
    private async createFailedTask(
        schedule: Schedule,
        triggeredBy: 'auto' | 'manual',
        errorMessage: string
    ): Promise<void> {
        try {
            const failedTaskId = `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const task: Task = {
                id: failedTaskId,
                userId: schedule.userId || 'unknown',
                toolId: schedule.toolId,
                toolName: schedule.name,
                marketplace: schedule.marketplace,
                urlCount: schedule.urls.length,
                status: 'failed',
                creditsUsed: 0,
                inputData: {
                    urls: schedule.urls,
                    marketplace: schedule.marketplace,
                    scheduleId: schedule.id,
                    triggeredBy,
                },
                error: errorMessage,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                urls: schedule.urls,
                processedAt: new Date().toISOString(),
            };

            await indexedDBService.put(STORES.TASKS, task);
            console.log('[Scheduler] Logged failed task to Activity:', failedTaskId);
        } catch (err) {
            console.error('[Scheduler] Failed to log failed task:', err);
        }
    }

    /**
     * Manually run a schedule (triggered by user)
     */
    async runScheduleManually(scheduleId: string): Promise<ScheduleRunResult> {
        console.log(`[Scheduler] Manual run requested for schedule ${scheduleId}`);

        // Get schedule from IndexedDB
        const schedule = await indexedDBService.getScheduleById(scheduleId);

        if (!schedule) {
            return {
                success: false,
                scheduleId,
                reason: 'Schedule not found',
            };
        }

        // We allow manual runs even if disabled
        // if (!schedule.enabled) { ... }

        // Check if already running
        if (this.activeRuns.has(scheduleId)) {
            return {
                success: false,
                scheduleId,
                reason: 'Schedule is already running',
            };
        }

        // Execute the schedule
        return await this.executeSchedule(schedule, 'manual');
    }

    /**
     * Calculate next run time for a schedule
     */
    private calculateNextRun(schedule: Schedule): Date {
        const now = new Date();
        const [hours, minutes] = schedule.time.split(':').map(Number);

        let nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);

        switch (schedule.frequency) {
            case 'hourly': {
                // Add interval hours to nextRun
                const interval = schedule.interval || 1;

                // If nextRun is in the past, keep adding interval until it's in the future
                while (nextRun <= now) {
                    nextRun.setHours(nextRun.getHours() + interval);
                }
                break;
            }

            case 'daily':
                // If time has passed today, schedule for tomorrow
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;

            case 'weekly': {
                // Parse day of week from cron expression
                if (schedule.cronExpression) {
                    const cronParts = schedule.cronExpression.split(' ');
                    if (cronParts.length >= 5) {
                        const targetDay = parseInt(cronParts[4]);
                        if (!isNaN(targetDay)) {
                            const currentDay = nextRun.getDay();
                            let daysUntilNext = targetDay - currentDay;

                            if (daysUntilNext <= 0 || (daysUntilNext === 0 && nextRun <= now)) {
                                daysUntilNext += 7;
                            }

                            nextRun.setDate(nextRun.getDate() + daysUntilNext);
                        }
                    }
                }
                break;
            }

            case 'monthly': {
                // Parse day of month from cron expression
                if (schedule.cronExpression) {
                    const cronParts = schedule.cronExpression.split(' ');
                    if (cronParts.length >= 5) {
                        const targetDay = parseInt(cronParts[2]);
                        if (!isNaN(targetDay)) {
                            nextRun.setDate(targetDay);

                            // If that day has passed this month, schedule for next month
                            if (nextRun <= now) {
                                nextRun.setMonth(nextRun.getMonth() + 1);
                            }
                        }
                    }
                }
                break;
            }
        }

        return nextRun;
    }

    /**
     * Check if a schedule is currently running
     */
    isScheduleRunning(scheduleId: string): boolean {
        return this.activeRuns.has(scheduleId);
    }

    /**
     * Get all active runs
     */
    getActiveRuns(): string[] {
        return Array.from(this.activeRuns.keys());
    }

    /**
     * Clean up
     */
    async destroy(): Promise<void> {
        await chrome.alarms.clear('schedule_check');
        this.activeRuns.clear();
        this.isInitialized = false;
    }
}

export const schedulerService = new SchedulerService();

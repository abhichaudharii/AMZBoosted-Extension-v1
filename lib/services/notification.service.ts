/**
 * Notification Service
 * Handles browser notifications for tool completion, errors, etc.
 */

import { authService } from './auth.service';
import { indexedDBService } from './indexed-db.service';
import { STORES, type Notification } from '@/lib/db/schema';

interface NotificationOptions {
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    priority?: 0 | 1 | 2; // 0 = low, 1 = normal, 2 = high
    requireInteraction?: boolean;
    buttons?: { title: string; iconUrl?: string }[];
    relatedId?: string;
    relatedType?: 'task' | 'schedule' | 'export' | 'credits';
    actionUrl?: string;
    actionLabel?: string;
}

class NotificationService {
    private notificationQueue: string[] = [];
    private channel: BroadcastChannel;
    private listeners: (() => void)[] = [];

    constructor() {
        this.channel = new BroadcastChannel('notifications_channel');
    }

    /**
     * Subscribe to notification updates
     */
    subscribe(callback: () => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify local listeners
     */
    private notifyListeners() {
        this.listeners.forEach(cb => cb());
    }

    /**
     * Show browser notification AND save to in-app notifications
     */
    async show(options: NotificationOptions): Promise<string> {
        // Save to IndexedDB first for in-app notifications
        const inAppNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        try {
            const user = await authService.getCurrentUser();
            const userId = user?.id || '';

            const inAppNotification: Notification = {
                id: inAppNotifId,
                userId,
                type: options.type || 'info',
                title: options.title,
                message: options.message,
                read: false,
                relatedId: options.relatedId,
                relatedType: options.relatedType,
                actionUrl: options.actionUrl,
                actionLabel: options.actionLabel,
                createdAt: new Date().toISOString(),
            };

            await indexedDBService.put(STORES.NOTIFICATIONS, inAppNotification);
            console.log('[Notification] Saved to IndexedDB:', inAppNotifId);

            // Notify other components
            this.channel.postMessage({ type: 'NEW_NOTIFICATION' });
            this.notifyListeners();
        } catch (error) {
            console.error('[Notification] Failed to save to IndexedDB:', error);
        }

        // Then show browser notification
        const iconUrl = this.getIconForType(options.type || 'info');

        const browserNotifId = await new Promise<string>((resolve) => {
            try {
                chrome.notifications.create(
                    {
                        type: 'basic',
                        iconUrl,
                        title: options.title,
                        message: options.message,
                        priority: options.priority || 1,
                        requireInteraction: options.requireInteraction || false,
                        buttons: options.buttons,
                    },
                    (id) => {
                        // Check for any errors and log them
                        if (chrome.runtime.lastError) {
                            console.error('[Notification] Chrome error:', chrome.runtime.lastError);
                            // Still resolve with the ID if it was created
                            resolve(id || '');
                        } else {
                            resolve(id || '');
                        }
                    }
                );
            } catch (error) {
                console.error('[Notification] Failed to create notification:', error);
                resolve('');
            }
        });

        if (!browserNotifId) {
            console.warn('[Notification] Failed to create browser notification - no ID returned');
            return inAppNotifId; // Return in-app notification ID anyway
        }

        this.notificationQueue.push(browserNotifId);

        // Auto-clear after 5 seconds unless requireInteraction
        if (!options.requireInteraction) {
            setTimeout(() => {
                if (chrome.notifications && chrome.notifications.clear) {
                    try {
                        chrome.notifications.clear(browserNotifId);
                        this.notificationQueue = this.notificationQueue.filter((id) => id !== browserNotifId);
                    } catch (error) {
                        console.error('[Notification] Failed to clear notification:', error);
                    }
                }
            }, 5000);
        }

        return inAppNotifId; // Return in-app notification ID for tracking
    }

    /**
     * 🔹 Alias for backward compatibility
     */
    create(options: NotificationOptions) {
        return this.show(options);
    }

    /**
     * Tool completion notification
     */
    async notifyToolComplete(data: {
        toolName: string;
        urlCount: number;
        successCount: number;
        errorCount: number;
        duration: number;
    }): Promise<void> {
        const { toolName, urlCount, successCount, errorCount, duration: _duration } = data;

        // const _durationMin = Math.floor(duration / 60);
        // const _durationSec = duration % 60;
        // const durationStr = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;

        if (successCount === 0 && errorCount === 0) {
            await this.show({
                title: `${toolName} - No Data Found`,
                message: `Process completed successfully, but no data was found matching your criteria.`,
                type: 'info',
                requireInteraction: true,
            });
        } else if (errorCount === 0) {
            await this.show({
                title: `${toolName} Complete ✓`,
                message: `Successfully processed ${successCount}/${urlCount} items`,
                type: 'success',
                buttons: [{ title: 'View Results' }],
            });
        } else if (successCount > 0) {
            await this.show({
                title: `${toolName} Partially Complete`,
                message: `Processed ${successCount}/${urlCount} items. ${errorCount} failed.`,
                type: 'warning',
                buttons: [{ title: 'View Results' }, { title: 'View Errors' }],
                requireInteraction: true,
            });
        } else {
            await this.show({
                title: `${toolName} Failed`,
                message: `All ${urlCount} items failed to process. Check logs for details.`,
                type: 'error',
                buttons: [{ title: 'View Errors' }],
                requireInteraction: true,
            });
        }
    }

    /**
     * Credits low notification
     */
    async notifyCreditsLow(remaining: number, total: number): Promise<void> {
        const percentage = Math.round((remaining / total) * 100);

        await this.show({
            title: 'Credits Running Low',
            message: `You have ${remaining.toLocaleString()} credits remaining (${percentage}%). Consider upgrading your plan.`,
            type: 'warning',
            buttons: [{ title: 'Upgrade Now' }],
            requireInteraction: true,
        });
    }

    /**
     * Credits depleted notification
     */
    async notifyCreditsDepleted(): Promise<void> {
        await this.show({
            title: 'Credits Depleted',
            message: 'You have run out of credits. Upgrade your plan to continue using tools.',
            type: 'error',
            buttons: [{ title: 'Upgrade Now' }],
            requireInteraction: true,
            priority: 2,
        });
    }

    /**
     * Schedule completed notification
     */
    async notifyScheduleComplete(scheduleName: string, success: boolean, itemsProcessed?: number): Promise<void> {
        if (success && itemsProcessed === 0) {
            await this.show({
                title: 'Schedule Completed - No Data',
                message: `"${scheduleName}" completed, but no data was found.`,
                type: 'info',
                requireInteraction: true,
            });
        } else {
            await this.show({
                title: success ? 'Schedule Completed' : 'Schedule Failed',
                message: `"${scheduleName}" ${success ? 'completed successfully' : 'failed to execute'}`,
                type: success ? 'success' : 'error',
                buttons: [{ title: 'View Results' }],
            });
        }
    }

    /**
     * Integration sync notification
     */
    async notifyIntegrationSync(integrationName: string, success: boolean): Promise<void> {
        await this.show({
            title: success ? 'Integration Synced' : 'Integration Sync Failed',
            message: `${integrationName} ${success ? 'has been synced' : 'failed to sync'}`,
            type: success ? 'success' : 'error',
        });
    }

    /**
     * Trial expiring notification
     */
    async notifyTrialExpiring(daysLeft: number): Promise<void> {
        await this.show({
            title: 'Trial Expiring Soon',
            message: `Your free trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade to continue using AMZBoosted.`,
            type: 'warning',
            buttons: [{ title: 'Upgrade Now' }],
            requireInteraction: true,
            priority: 2,
        });
    }

    /**
     * Export ready notification
     */
    async notifyExportReady(format: string, rowCount: number): Promise<void> {
        await this.show({
            title: 'Export Ready',
            message: `Your ${format.toUpperCase()} export with ${rowCount.toLocaleString()} rows is ready to download.`,
            type: 'success',
            buttons: [{ title: 'Download' }],
        });
    }

    /**
     * Get icon based on notification type
     */
    private getIconForType(type: 'success' | 'error' | 'info' | 'warning'): string {
        // Use chrome.runtime.getURL to get proper extension URL
        const icons = {
            success: chrome.runtime.getURL('/icon/128.png'),
            error: chrome.runtime.getURL('/icon/128.png'),
            info: chrome.runtime.getURL('/icon/128.png'),
            warning: chrome.runtime.getURL('/icon/128.png'),
        };
        return icons[type];
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        for (const id of this.notificationQueue) {
            if (chrome.notifications && chrome.notifications.clear) {
                try {
                    chrome.notifications.clear(id);
                } catch (error) {
                    console.error('[Notification] Failed to clear notification:', id, error);
                }
            }
        }
        this.notificationQueue = [];
        this.channel.postMessage({ type: 'CLEAR_ALL' });
        this.notifyListeners();
    }

    /**
     * Handle notification click
     */
    onClicked(callback: (notificationId: string, buttonIndex?: number) => void): void {
        try {
            chrome.notifications.onClicked.addListener((notificationId) => {
                try {
                    callback(notificationId);
                } catch (error) {
                    console.error('[Notification] Error in click callback:', error);
                }
            });
        } catch (error) {
            console.error('[Notification] Failed to add click listener:', error);
        }

        try {
            chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
                try {
                    callback(notificationId, buttonIndex);
                } catch (error) {
                    console.error('[Notification] Error in button click callback:', error);
                }
            });
        } catch (error) {
            console.error('[Notification] Failed to add button click listener:', error);
        }
    }
}

export const notificationService = new NotificationService();

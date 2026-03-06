/**
 * useNotifications Hook
 * React hook for managing notifications in IndexedDB
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { indexedDBService } from '@/lib/services/indexed-db.service';
import { notificationService } from '@/lib/services/notification.service';
import { type Notification } from '@/lib/db/schema';

interface UseNotificationsOptions {
    unreadOnly?: boolean;
    autoLoad?: boolean;
    pollInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
    const { unreadOnly = false, autoLoad = true, pollInterval = 0 } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const loadedRef = useRef(false);

    /**
     * Load notifications from IndexedDB
     */
    const loadNotifications = useCallback(async () => {
        try {
            if (!loadedRef.current) {
                setLoading(true);
            }
            setError(null);

            let allNotifications = await indexedDBService.getAllNotifications();

            // Apply filters
            if (unreadOnly) {
                allNotifications = allNotifications.filter((n) => !n.read);
            }

            // Sort by creation date (newest first)
            allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setNotifications(allNotifications);

            // Update unread count
            const unread = allNotifications.filter((n) => !n.read).length;
            setUnreadCount(unread);

            loadedRef.current = true;
            // console.log('[useNotifications] Loaded', allNotifications.length, 'notifications,', unread, 'unread');
        } catch (err: any) {
            console.error('[useNotifications] Error loading notifications:', err);
            setError(err.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [unreadOnly]);

    // Auto-load notifications on mount
    useEffect(() => {
        if (autoLoad) {
            loadNotifications();
        }

        // Listen for cross-tab/window updates
        const channel = new BroadcastChannel('notifications_channel');
        channel.onmessage = (event) => {
            if (event.data.type === 'NEW_NOTIFICATION' || event.data.type === 'CLEAR_ALL' || event.data.type === 'UPDATE') {
                loadNotifications();
            }
        };

        // Subscribe to local service updates (for same-window real-time updates)
        // This fixes the issue where the badge doesn't update immediately
        const unsubscribe = notificationService.subscribe(() => {
            loadNotifications();
        });

        return () => {
            channel.close();
            unsubscribe();
        };
    }, [autoLoad, loadNotifications]);

    // Poll for new notifications
    useEffect(() => {
        if (!pollInterval || pollInterval <= 0) return;

        const interval = setInterval(() => {
            loadNotifications();
        }, pollInterval);

        return () => clearInterval(interval);
    }, [loadNotifications, pollInterval]);

    /**
     * Notify other components of updates
     */
    const notifyUpdate = () => {
        const channel = new BroadcastChannel('notifications_channel');
        channel.postMessage({ type: 'UPDATE' });
        channel.close();
    };

    /**
     * Mark notification as unread
     */
    const markAsUnread = useCallback(async (notificationId: string) => {
        try {
            await indexedDBService.updateNotification(notificationId, { read: false });
            await loadNotifications();
            notifyUpdate();
            console.log('[useNotifications] Marked as unread:', notificationId);
        } catch (err) {
            console.error('[useNotifications] Error marking as unread:', err);
        }
    }, [loadNotifications]);

    /**
     * Mark notification as read
     */
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await indexedDBService.updateNotification(notificationId, { read: true });
            await loadNotifications();
            notifyUpdate();
            console.log('[useNotifications] Marked as read:', notificationId);
        } catch (err) {
            console.error('[useNotifications] Error marking as read:', err);
        }
    }, [loadNotifications]);

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            await indexedDBService.markAllAsRead();
            await loadNotifications();
            notifyUpdate();
            console.log('[useNotifications] Marked all as read');
        } catch (err) {
            console.error('[useNotifications] Error marking all as read:', err);
        }
    }, [loadNotifications]);

    /**
     * Delete notification
     */
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            await indexedDBService.deleteNotification(notificationId);
            await loadNotifications();
            notifyUpdate();
            console.log('[useNotifications] Deleted notification:', notificationId);
        } catch (err) {
            console.error('[useNotifications] Error deleting notification:', err);
        }
    }, [loadNotifications]);

    /**
     * Clear all notifications
     */
    const clearAll = useCallback(async () => {
        try {
            const allNotifications = await indexedDBService.getAllNotifications();
            for (const notif of allNotifications) {
                await indexedDBService.deleteNotification(notif.id);
            }
            await loadNotifications();
            notifyUpdate();
            console.log('[useNotifications] Cleared all notifications');
        } catch (err) {
            console.error('[useNotifications] Error clearing notifications:', err);
        }
    }, [loadNotifications]);

    return {
        notifications,
        loading,
        error,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        clearAll,
    };
}

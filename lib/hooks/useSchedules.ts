/**
 * useSchedules Hook
 * React hook for managing schedules in IndexedDB
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { indexedDBService } from '@/lib/services/indexed-db.service';
import { apiClient } from '@/lib/api/client';
import { STORES, type Schedule } from '@/lib/db/schema';

interface UseSchedulesOptions {
    toolId?: string;
    enabled?: boolean;
    autoLoad?: boolean;
    pollInterval?: number;
}

export function useSchedules(options: UseSchedulesOptions = {}) {
    const { toolId, enabled, autoLoad = true, pollInterval: _pollInterval } = options;

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadedRef = useRef(false);

    /**
     * Load schedules from IndexedDB
     */
    const loadSchedules = useCallback(async () => {
        try {
            // Only set loading on initial load
            if (!loadedRef.current) {
                setLoading(true);
            }
            setError(null);

            let allSchedules = await indexedDBService.getAll<Schedule>(STORES.SCHEDULES);

            // Apply filters
            if (toolId) {
                allSchedules = allSchedules.filter((s) => s.toolId === toolId);
            }
            if (enabled !== undefined) {
                allSchedules = allSchedules.filter((s) => s.enabled === enabled);
            }

            // Sort by next run date
            allSchedules.sort((a, b) => {
                if (!a.nextRunAt) return 1;
                if (!b.nextRunAt) return -1;
                return new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime();
            });

            setSchedules(allSchedules);
            loadedRef.current = true;
        } catch (err: any) {
            console.error('[useSchedules] Error loading schedules:', err);
            setError(err.message || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    }, [toolId, enabled]);

    /**
     * Create a new schedule (with server permission check)
     */
    const createSchedule = useCallback(async (schedule: Schedule): Promise<Schedule> => {
        try {
            // Check permission with server
            const permission = await apiClient.checkPermission({
                action: 'create_schedule',
                toolId: schedule.toolId,
                urlCount: 0, // Schedule creation doesn't consume credits immediately
            });

            if (!permission?.allowed) {
                throw new Error(permission?.reason || 'Schedule creation not allowed');
            }

            // Check local count against plan limit
            const currentCount = await indexedDBService.count(STORES.SCHEDULES);
            const maxSchedules = permission.maxSchedules !== undefined ? permission.maxSchedules : 0;

            // -1 means unlimited
            if (maxSchedules !== -1 && currentCount >= maxSchedules) {
                throw new Error(`Maximum schedules reached (${maxSchedules}). Upgrade your plan for more.`);
            }

            // Create schedule locally
            await indexedDBService.put(STORES.SCHEDULES, schedule);
            await loadSchedules();
            return schedule;
        } catch (err: any) {
            console.error('[useSchedules] Error creating schedule:', err);
            throw err;
        }
    }, [loadSchedules]);

    /**
     * Create multiple schedules in batch - checks permission ONCE for all
     */
    const createSchedulesBatch = useCallback(async (schedulesToCreate: Schedule[]): Promise<Schedule[]> => {
        try {
            if (schedulesToCreate.length === 0) {
                return [];
            }

            // Check permission ONCE for the batch
            const permission = await apiClient.checkPermission({
                action: 'create_schedule',
                toolId: schedulesToCreate[0].toolId,
                urlCount: schedulesToCreate.length, // Pass count for batch check
            });

            if (!permission?.allowed) {
                throw new Error(permission?.reason || 'Schedule creation not allowed');
            }

            // Check if we have enough space for all schedules
            const currentCount = await indexedDBService.count(STORES.SCHEDULES);
            const maxSchedules = permission.maxSchedules !== undefined ? permission.maxSchedules : 0;

            // -1 means unlimited
            if (maxSchedules !== -1) {
                const spaceAvailable = maxSchedules - currentCount;
                if (schedulesToCreate.length > spaceAvailable) {
                    throw new Error(`Cannot create ${schedulesToCreate.length} schedules. Only ${spaceAvailable} slots available. Upgrade your plan for more.`);
                }
            }

            // Create all schedules
            const createdSchedules: Schedule[] = [];
            for (const schedule of schedulesToCreate) {
                await indexedDBService.put(STORES.SCHEDULES, schedule);
                createdSchedules.push(schedule);
            }

            await loadSchedules();
            return createdSchedules;
        } catch (err: any) {
            console.error('[useSchedules] Error creating schedules batch:', err);
            throw err;
        }
    }, [loadSchedules]);

    /**
     * Update a schedule
     */
    const updateSchedule = useCallback(async (id: string, updates: Partial<Schedule>): Promise<void> => {
        try {
            const existing = await indexedDBService.getById<Schedule>(STORES.SCHEDULES, id);
            if (!existing) {
                throw new Error('Schedule not found');
            }

            const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
            await indexedDBService.put(STORES.SCHEDULES, updated);
            await loadSchedules();
        } catch (err: any) {
            console.error('[useSchedules] Error updating schedule:', err);
            throw err;
        }
    }, [loadSchedules]);

    /**
     * Delete a schedule
     */
    const deleteSchedule = useCallback(async (id: string): Promise<void> => {
        try {
            await indexedDBService.delete(STORES.SCHEDULES, id);
            await loadSchedules();
        } catch (err: any) {
            console.error('[useSchedules] Error deleting schedule:', err);
            throw err;
        }
    }, [loadSchedules]);

    /**
     * Toggle schedule enabled/disabled
     */
    const toggleSchedule = useCallback(async (id: string): Promise<void> => {
        try {
            const existing = await indexedDBService.getById<Schedule>(STORES.SCHEDULES, id);
            if (!existing) {
                throw new Error('Schedule not found');
            }

            await updateSchedule(id, { enabled: !existing.enabled });
        } catch (err: any) {
            console.error('[useSchedules] Error toggling schedule:', err);
            throw err;
        }
    }, [updateSchedule]);

    /**
     * Get schedule by ID
     */
    const getScheduleById = useCallback(async (id: string): Promise<Schedule | undefined> => {
        try {
            return await indexedDBService.getById<Schedule>(STORES.SCHEDULES, id);
        } catch (err: any) {
            console.error('[useSchedules] Error getting schedule:', err);
            throw err;
        }
    }, []);

    /**
     * Get statistics
     */
    const getStats = useCallback(() => {
        const total = schedules.length;
        const active = schedules.filter((s) => s.enabled).length;
        const inactive = schedules.filter((s) => !s.enabled).length;

        return {
            total,
            active,
            inactive,
        };
    }, [schedules]);

    // Auto-load
    useEffect(() => {
        if (autoLoad) {
            loadSchedules();
        }
    }, [autoLoad, loadSchedules]);

    return {
        schedules,
        loading,
        error,
        loadSchedules,
        createSchedule,
        createSchedulesBatch,
        updateSchedule,
        deleteSchedule,
        toggleSchedule,
        getScheduleById,
        getStats,
    };
}

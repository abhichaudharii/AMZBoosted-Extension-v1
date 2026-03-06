/**
 * useTasks Hook
 * React hook for managing tasks in IndexedDB
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { indexedDBService } from '@/lib/services/indexed-db.service';
import { STORES, type Task } from '@/lib/db/schema';

interface UseTasksOptions {
    toolId?: string;
    status?: Task['status'];
    marketplace?: string;
    autoLoad?: boolean;
    pollInterval?: number;
}

export function useTasks(options: UseTasksOptions = {}) {
    const { toolId, status, marketplace, autoLoad = true, pollInterval: _pollInterval } = options;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadedRef = useRef(false);

    /**
     * Load tasks from IndexedDB
     */
    const loadTasks = useCallback(async () => {
        try {
            if (!loadedRef.current) {
                setLoading(true);
            }
            setError(null);

            let allTasks = await indexedDBService.getAll<Task>(STORES.TASKS);

            // Apply filters
            if (toolId) {
                allTasks = allTasks.filter((t) => t.toolId === toolId);
            }
            if (status) {
                allTasks = allTasks.filter((t) => t.status === status);
            }
            if (marketplace) {
                allTasks = allTasks.filter((t) => t.marketplace === marketplace);
            }

            // Sort by creation date (newest first)
            allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setTasks(allTasks);
            loadedRef.current = true;
        } catch (err: any) {
            console.error('[useTasks] Error loading tasks:', err);
            setError(err.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [toolId, status, marketplace]);

    /**
     * Create a new task
     */
    const createTask = useCallback(async (task: Task): Promise<Task> => {
        try {
            await indexedDBService.put(STORES.TASKS, task);
            await loadTasks(); // Reload tasks
            return task;
        } catch (err: any) {
            console.error('[useTasks] Error creating task:', err);
            throw err;
        }
    }, [loadTasks]);

    /**
     * Update a task
     */
    const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<void> => {
        try {
            const existing = await indexedDBService.getById<Task>(STORES.TASKS, id);
            if (!existing) {
                throw new Error('Task not found');
            }

            const updated = { ...existing, ...updates };
            await indexedDBService.put(STORES.TASKS, updated);
            await loadTasks(); // Reload tasks
        } catch (err: any) {
            console.error('[useTasks] Error updating task:', err);
            throw err;
        }
    }, [loadTasks]);

    /**
     * Delete a task
     */
    const deleteTask = useCallback(async (id: string): Promise<void> => {
        try {
            await indexedDBService.delete(STORES.TASKS, id);
            await loadTasks(); // Reload tasks
        } catch (err: any) {
            console.error('[useTasks] Error deleting task:', err);
            throw err;
        }
    }, [loadTasks]);

    /**
     * Get paginated tasks
     */
    const getPage = useCallback(async (page: number, pageSize: number = 20) => {
        try {
            return await indexedDBService.getPage<Task>(
                STORES.TASKS,
                page,
                pageSize,
                'createdAt',
                'next'
            );
        } catch (err: any) {
            console.error('[useTasks] Error getting page:', err);
            throw err;
        }
    }, []);

    /**
     * Get statistics
     */
    const getStats = useCallback(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const failed = tasks.filter((t) => t.status === 'failed').length;
        const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'processing').length;
        const totalCreditsUsed = tasks.reduce((sum, t) => sum + (t.creditsUsed || 0), 0);

        return {
            total,
            completed,
            failed,
            pending,
            totalCreditsUsed,
            successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }, [tasks]);

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad) {
            loadTasks();
        }
    }, [autoLoad, loadTasks]);

    return {
        tasks,
        loading,
        error,
        loadTasks,
        refresh: loadTasks, // Alias for convenience
        createTask,
        updateTask,
        deleteTask,
        getPage,
        getStats,
    };
}

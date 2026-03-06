/**
 * useExports Hook
 * React hook for managing exports in IndexedDB
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { indexedDBService } from '@/lib/services/indexed-db.service';
import { apiClient } from '@/lib/api/client';
import { STORES, type Export } from '@/lib/db/schema';

interface UseExportsOptions {
    toolId?: string;
    reportId?: string;
    format?: Export['format'];
    autoLoad?: boolean;
    pollInterval?: number;
}

export function useExports(options: UseExportsOptions = {}) {
    const { toolId, reportId, format, autoLoad = true, pollInterval } = options;

    const [exports, setExports] = useState<Export[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadedRef = useRef(false);

    /**
     * Load exports from IndexedDB
     */
    const loadExports = useCallback(async () => {
        try {
            if (!loadedRef.current) {
                setLoading(true);
            }
            setError(null);

            let allExports = await indexedDBService.getAll<Export>(STORES.EXPORTS);

            // Apply filters
            if (toolId) {
                allExports = allExports.filter((e) => e.toolId === toolId);
            }
            if (reportId) {
                allExports = allExports.filter((e) => e.taskId === reportId);
            }
            if (format) {
                allExports = allExports.filter((e) => e.format === format);
            }

            // Sort by creation date (newest first)
            allExports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setExports(allExports);
            loadedRef.current = true;
        } catch (err: any) {
            console.error('[useExports] Error loading exports:', err);
            setError(err.message || 'Failed to load exports');
        } finally {
            setLoading(false);
        }
    }, [toolId, reportId, format]);

    /**
     * Create a new export (with server permission check)
     */
    const createExport = useCallback(async (exportData: Export): Promise<Export> => {
        try {
            // Check permission with server
            const permission = await apiClient.checkPermission({
                action: 'create_export',
                toolId: exportData.toolId,
                urlCount: 0
            });

            if (!permission?.allowed) {
                throw new Error(permission?.reason || 'Export creation not allowed');
            }

            // Check this month's count against plan limit
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            // Create export locally
            await indexedDBService.put(STORES.EXPORTS, exportData);
            await loadExports();
            return exportData;
        } catch (err: any) {
            console.error('[useExports] Error creating export:', err);
            throw err;
        }
    }, [loadExports]);

    /**
     * Delete an export
     */
    const deleteExport = useCallback(async (id: string): Promise<void> => {
        try {
            await indexedDBService.delete(STORES.EXPORTS, id);
            await loadExports();
        } catch (err: any) {
            console.error('[useExports] Error deleting export:', err);
            throw err;
        }
    }, [loadExports]);

    /**
     * Restore an export (bypass permission check for undo operations)
     */
    const restoreExport = useCallback(async (exportData: Export): Promise<Export> => {
        try {
            // Directly restore to IndexedDB without permission check
            await indexedDBService.put(STORES.EXPORTS, exportData);
            await loadExports();
            return exportData;
        } catch (err: any) {
            console.error('[useExports] Error restoring export:', err);
            throw err;
        }
    }, [loadExports]);

    /**
     * Get statistics
     */
    const getStats = useCallback(() => {
        const total = exports.length;

        // This month's exports
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const thisMonth = exports.filter(
            (e) => new Date(e.createdAt) >= firstDayOfMonth
        ).length;

        // By format
        const byFormat = exports.reduce((acc, exp) => {
            acc[exp.format] = (acc[exp.format] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            thisMonth,
            byFormat,
        };
    }, [exports]);

    // Auto-load on mount
    useEffect(() => {
        if (autoLoad) {
            loadExports();
        }
    }, [autoLoad, loadExports]);

    // Poll for updates if pollInterval is set
    useEffect(() => {
        if (!pollInterval || pollInterval <= 0) return;

        const interval = setInterval(() => {
            loadExports();
        }, pollInterval);

        return () => clearInterval(interval);
    }, [pollInterval, loadExports]);

    return {
        exports,
        loading,
        error,
        loadExports,
        createExport,
        deleteExport,
        restoreExport,
        getStats,
    };
}

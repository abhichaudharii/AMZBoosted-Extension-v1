/**
 * useReports Hook
 * React hook for managing reports in IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import { indexedDBService } from '@/lib/services/indexed-db.service';
import { STORES, type Report } from '@/lib/db/schema';

interface UseReportsOptions {
  toolId?: string;
  toolName?: string;
  autoLoad?: boolean;
}

export function useReports(options: UseReportsOptions = {}) {
  const { toolId, toolName, autoLoad = true } = options;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load reports from IndexedDB
   */
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let allReports = await indexedDBService.getAll<Report>(STORES.REPORTS);

      // Apply filters
      if (toolId) {
        allReports = allReports.filter((r) => r.toolId === toolId);
      }
      if (toolName) {
        allReports = allReports.filter((r) => r.toolName === toolName);
      }

      // Sort by creation date (newest first)
      allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setReports(allReports);
    } catch (err: any) {
      console.error('[useReports] Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [toolId, toolName]);

  /**
   * Create a new report
   */
  const createReport = useCallback(async (report: Report): Promise<Report> => {
    try {
      await indexedDBService.put(STORES.REPORTS, report);
      await loadReports(); // Reload reports
      return report;
    } catch (err: any) {
      console.error('[useReports] Error creating report:', err);
      throw err;
    }
  }, [loadReports]);

  /**
   * Update a report
   */
  const updateReport = useCallback(async (id: string, updates: Partial<Report>): Promise<void> => {
    try {
      const existing = await indexedDBService.getById<Report>(STORES.REPORTS, id);
      if (!existing) {
        throw new Error('Report not found');
      }

      const updated = { ...existing, ...updates };
      await indexedDBService.put(STORES.REPORTS, updated);
      await loadReports();
    } catch (err: any) {
      console.error('[useReports] Error updating report:', err);
      throw err;
    }
  }, [loadReports]);

  /**
   * Delete a report
   */
  const deleteReport = useCallback(async (id: string): Promise<void> => {
    try {
      await indexedDBService.delete(STORES.REPORTS, id);
      await loadReports();
    } catch (err: any) {
      console.error('[useReports] Error deleting report:', err);
      throw err;
    }
  }, [loadReports]);

  /**
   * Get paginated reports
   */
  const getPage = useCallback(async (page: number, pageSize: number = 20) => {
    try {
      return await indexedDBService.getPage<Report>(
        STORES.REPORTS,
        page,
        pageSize,
        'createdAt',
        'next'
      );
    } catch (err: any) {
      console.error('[useReports] Error getting page:', err);
      throw err;
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadReports();
    }
  }, [autoLoad, loadReports]);

  return {
    reports,
    loading,
    error,
    loadReports,
    createReport,
    updateReport,
    deleteReport,
    getPage,
  };
}

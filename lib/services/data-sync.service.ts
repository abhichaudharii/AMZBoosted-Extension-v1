/**
 * Data Sync Service (Client-Side Only)
 * NO SERVER SYNC - All data stays on the client
 * Marketing: "Your data never leaves your device"
 */

import { indexedDBService } from './indexed-db.service';
import { STORES } from '@/lib/db/schema';
import type { Task, Report, Schedule, Export } from '@/lib/db/schema';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncResult {
  storeName: string;
  status: SyncStatus;
  recordsSynced: number;
  error?: string;
}

class DataSyncService {
  /**
   * Initialize IndexedDB on extension install/update
   */
  async initialize(): Promise<void> {
    try {
      console.log('[DataSync] Initializing IndexedDB...');
      await indexedDBService.initialize();
      console.log('[DataSync] IndexedDB initialized successfully');
    } catch (error) {
      console.error('[DataSync] Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get all tasks from IndexedDB
   */
  async getTasks(): Promise<Task[]> {
    return indexedDBService.getAll<Task>(STORES.TASKS);
  }

  /**
   * Get all reports from IndexedDB
   */
  async getReports(): Promise<Report[]> {
    return indexedDBService.getAll<Report>(STORES.REPORTS);
  }

  /**
   * Get all schedules from IndexedDB
   */
  async getSchedules(): Promise<Schedule[]> {
    return indexedDBService.getAll<Schedule>(STORES.SCHEDULES);
  }

  /**
   * Get all exports from IndexedDB
   */
  async getExports(): Promise<Export[]> {
    return indexedDBService.getAll<Export>(STORES.EXPORTS);
  }

  /**
   * Clear all local data (on logout)
   */
  async clearAllData(): Promise<void> {
    console.log('[DataSync] Clearing all local data...');
    await indexedDBService.clearAll();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    [key: string]: { totalRecords: number };
  }> {
    const stats: any = {};

    for (const storeName of Object.values(STORES)) {
      if (storeName === STORES.SYNC_METADATA) continue;

      const totalRecords = await indexedDBService.count(storeName);
      stats[storeName] = { totalRecords };
    }

    return stats;
  }

  /**
   * Export all data as JSON (for backup/export feature)
   */
  async exportAllData(): Promise<{
    tasks: Task[];
    reports: Report[];
    schedules: Schedule[];
    exports: Export[];
    exportedAt: string;
  }> {
    const [tasks, reports, schedules, exports] = await Promise.all([
      this.getTasks(),
      this.getReports(),
      this.getSchedules(),
      this.getExports(),
    ]);

    return {
      tasks,
      reports,
      schedules,
      exports,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import data from JSON backup
   */
  async importData(data: {
    tasks?: Task[];
    reports?: Report[];
    schedules?: Schedule[];
    exports?: Export[];
  }): Promise<{
    tasksImported: number;
    reportsImported: number;
    schedulesImported: number;
    exportsImported: number;
  }> {
    const results = {
      tasksImported: 0,
      reportsImported: 0,
      schedulesImported: 0,
      exportsImported: 0,
    };

    if (data.tasks && data.tasks.length > 0) {
      await indexedDBService.putBatch(STORES.TASKS, data.tasks);
      results.tasksImported = data.tasks.length;
    }

    if (data.reports && data.reports.length > 0) {
      await indexedDBService.putBatch(STORES.REPORTS, data.reports);
      results.reportsImported = data.reports.length;
    }

    if (data.schedules && data.schedules.length > 0) {
      await indexedDBService.putBatch(STORES.SCHEDULES, data.schedules);
      results.schedulesImported = data.schedules.length;
    }

    if (data.exports && data.exports.length > 0) {
      await indexedDBService.putBatch(STORES.EXPORTS, data.exports);
      results.exportsImported = data.exports.length;
    }

    return results;
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();

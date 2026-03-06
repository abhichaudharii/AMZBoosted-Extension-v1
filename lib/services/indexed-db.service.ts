/**
 * IndexedDB Service
 * Handles all IndexedDB operations for local data storage
 */

import {
    DB_NAME,
    DB_VERSION,
    STORES,
    initializeSchema,
    type Task,
    type Report,
    type Schedule,
    type Export,
    type SyncMetadata,
    type Notification,
    type PriceTracker,
    type PriceHistory,
} from '@/lib/db/schema';

type StoreData = Task | Report | Schedule | Export | SyncMetadata | Notification | PriceTracker | PriceHistory;

class IndexedDBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<IDBDatabase> | null = null;

    /**
     * Initialize the database
     */
    async initialize(): Promise<IDBDatabase> {
        // Return existing initialization promise if already initializing
        if (this.initPromise) {
            return this.initPromise;
        }

        // Return existing connection if already initialized
        if (this.db) {
            return Promise.resolve(this.db);
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[IndexedDB] Failed to open database:', request.error);
                this.initPromise = null;
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;

                // Handle unexpected connection closure
                this.db.onclose = () => {
                    console.log('[IndexedDB] Database connection closed unexpectedly. Resetting state.');
                    this.db = null;
                    this.initPromise = null;
                };

                console.log('[IndexedDB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                console.log('[IndexedDB] Upgrading database schema...');
                initializeSchema(db);
            };
        });

        return this.initPromise;
    }

    /**
     * Ensure database is initialized
     */
    private async ensureInitialized(): Promise<IDBDatabase> {
        if (!this.db) {
            return this.initialize();
        }
        return this.db;
    }

    /**
     * Get a transaction, retrying initialization if connection is closing
     */
    private async getTransaction(storeNames: string | string[], mode: IDBTransactionMode): Promise<IDBTransaction> {
        let db = await this.ensureInitialized();
        try {
            return db.transaction(storeNames, mode);
        } catch (error: any) {
            // Check for InvalidStateError which indicates the connection is closing/closed
            if (error && (error.name === 'InvalidStateError' || error.message?.includes('closing'))) {
                console.warn('[IndexedDB] Database connection is closing/closed. Re-initializing...', error);
                this.db = null;
                this.initPromise = null;
                db = await this.ensureInitialized();
                return db.transaction(storeNames, mode);
            }
            throw error;
        }
    }

    /**
     * Get all records from a store
     */
    async getAll<T extends StoreData>(storeName: string): Promise<T[]> {
        // Use getTransaction to handle potential connection issues
        const transaction = await this.getTransaction(storeName, 'readonly');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get records by index
     */
    async getAllByIndex<T extends StoreData>(
        storeName: string,
        indexName: string,
        query: IDBValidKey | IDBKeyRange
    ): Promise<T[]> {
        const transaction = await this.getTransaction(storeName, 'readonly');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(query);

            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a single record by ID
     */
    async getById<T extends StoreData>(storeName: string, id: string): Promise<T | undefined> {
        const transaction = await this.getTransaction(storeName, 'readonly');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add or update a single record
     */
    async put<T extends StoreData>(storeName: string, data: T): Promise<void> {
        const transaction = await this.getTransaction(storeName, 'readwrite');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add or update multiple records (batch operation)
     */
    async putBatch<T extends StoreData>(storeName: string, items: T[]): Promise<void> {
        const transaction = await this.getTransaction(storeName, 'readwrite');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);

            let completed = 0;
            let hasError = false;

            items.forEach((item) => {
                const request = store.put(item);

                request.onsuccess = () => {
                    completed++;
                    if (completed === items.length && !hasError) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    if (!hasError) {
                        hasError = true;
                        reject(request.error);
                    }
                };
            });

            // Handle empty array case
            if (items.length === 0) {
                resolve();
            }
        });
    }

    /**
     * Delete a record by ID
     */
    async delete(storeName: string, id: string): Promise<void> {
        const transaction = await this.getTransaction(storeName, 'readwrite');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all records from a store
     */
    async clear(storeName: string): Promise<void> {
        const transaction = await this.getTransaction(storeName, 'readwrite');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Count records in a store
     */
    async count(storeName: string): Promise<number> {
        const transaction = await this.getTransaction(storeName, 'readonly');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get paginated results
     */
    async getPage<T extends StoreData>(
        storeName: string,
        page: number,
        pageSize: number,
        indexName?: string,
        direction: 'next' | 'prev' = 'next'
    ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
        const transaction = await this.getTransaction(storeName, 'readonly');

        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);

            // Get total count
            const countRequest = store.count();

            countRequest.onsuccess = () => {
                const total = countRequest.result;
                const offset = (page - 1) * pageSize;

                // Use index if specified, otherwise use primary key
                const source = indexName ? store.index(indexName) : store;
                const cursorDirection = direction === 'next' ? 'prev' : 'next'; // Reverse for descending order
                const request = source.openCursor(null, cursorDirection);

                const results: T[] = [];
                let advanced = false;
                let count = 0;

                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

                    if (!cursor) {
                        resolve({
                            data: results,
                            total,
                            hasMore: offset + pageSize < total,
                        });
                        return;
                    }

                    // Skip to offset
                    if (!advanced && offset > 0) {
                        advanced = true;
                        cursor.advance(offset);
                        return;
                    }

                    // Collect results for current page
                    if (count < pageSize) {
                        results.push(cursor.value as T);
                        count++;
                        cursor.continue();
                    } else {
                        resolve({
                            data: results,
                            total,
                            hasMore: offset + pageSize < total,
                        });
                    }
                };

                request.onerror = () => reject(request.error);
            };

            countRequest.onerror = () => reject(countRequest.error);
        });
    }

    /**
     * Get sync metadata for a store
     */
    async getSyncMetadata(storeName: string): Promise<SyncMetadata | undefined> {
        return this.getById<SyncMetadata>(STORES.SYNC_METADATA, storeName);
    }

    /**
     * Update sync metadata
     */
    async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
        await this.put(STORES.SYNC_METADATA, metadata);
    }

    /**
     * Get last sync time for a store
     */
    async getLastSyncTime(storeName: string): Promise<string | undefined> {
        const metadata = await this.getSyncMetadata(storeName);
        return metadata?.lastIncrementalSync || metadata?.lastFullSync || undefined;
    }

    /**
     * Update last sync time
     */
    async updateSyncTime(storeName: string, timestamp: string, syncType: 'full' | 'incremental' = 'incremental'): Promise<void> {
        const existing = await this.getSyncMetadata(storeName);
        const totalRecords = await this.count(storeName);

        const metadata: SyncMetadata = {
            storeName,
            lastFullSync: syncType === 'full' ? timestamp : existing?.lastFullSync,
            lastIncrementalSync: syncType === 'incremental' ? timestamp : existing?.lastIncrementalSync,
            totalRecords,
            syncStatus: 'idle',
        };

        await this.updateSyncMetadata(metadata);
    }

    /**
     * Clear all data (useful for logout)
     */
    async clearAll(): Promise<void> {
        const storeNames = Object.values(STORES);

        for (const storeName of storeNames) {
            await this.clear(storeName);
        }

        console.log('[IndexedDB] All data cleared');
    }

    /**
     * Close database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initPromise = null;
            console.log('[IndexedDB] Database closed');
        }
    }

    // ============================================
    // SCHEDULE-SPECIFIC CONVENIENCE METHODS
    // ============================================

    /**
     * Get all schedules
     */
    async getAllSchedules(): Promise<Schedule[]> {
        return this.getAll<Schedule>(STORES.SCHEDULES);
    }

    /**
     * Get a schedule by ID
     */
    async getScheduleById(id: string): Promise<Schedule | undefined> {
        return this.getById<Schedule>(STORES.SCHEDULES, id);
    }

    /**
     * Create a new schedule
     */
    async createSchedule(schedule: Schedule): Promise<void> {
        await this.put(STORES.SCHEDULES, schedule);
    }

    /**
     * Update an existing schedule
     */
    async updateSchedule(id: string, updates: Partial<Schedule>): Promise<void> {
        const existing = await this.getScheduleById(id);
        if (!existing) {
            throw new Error(`Schedule ${id} not found`);
        }
        const updated: Schedule = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await this.put(STORES.SCHEDULES, updated);
    }

    /**
     * Delete a schedule
     */
    async deleteSchedule(id: string): Promise<void> {
        await this.delete(STORES.SCHEDULES, id);
    }

    /**
     * Get enabled schedules
     */
    async getEnabledSchedules(): Promise<Schedule[]> {
        const allSchedules = await this.getAllSchedules();
        return allSchedules.filter((schedule) => schedule.enabled);
    }

    // ============================================
    // TASK-SPECIFIC CONVENIENCE METHODS
    // ============================================

    /**
     * Get all tasks
     */
    async getAllTasks(): Promise<Task[]> {
        return this.getAll<Task>(STORES.TASKS);
    }

    /**
     * Get a task by ID
     */
    async getTaskById(id: string): Promise<Task | undefined> {
        return this.getById<Task>(STORES.TASKS, id);
    }

    /**
     * Create a new task
     */
    async createTask(task: Task): Promise<void> {
        await this.put(STORES.TASKS, task);
    }

    /**
     * Update an existing task
     */
    async updateTask(id: string, updates: Partial<Task>): Promise<void> {
        const existing = await this.getTaskById(id);
        if (!existing) {
            throw new Error(`Task ${id} not found`);
        }
        const updated: Task = {
            ...existing,
            ...updates,
        };
        await this.put(STORES.TASKS, updated);
    }

    /**
     * Delete a task
     */
    async deleteTask(id: string): Promise<void> {
        await this.delete(STORES.TASKS, id);
    }

    // ============================================
    // EXPORT-SPECIFIC CONVENIENCE METHODS
    // ============================================

    /**
     * Get all exports
     */
    async getAllExports(): Promise<Export[]> {
        return this.getAll<Export>(STORES.EXPORTS);
    }

    /**
     * Get an export by ID
     */
    async getExportById(id: string): Promise<Export | undefined> {
        return this.getById<Export>(STORES.EXPORTS, id);
    }

    /**
     * Create a new export
     */
    async createExport(exportData: Export): Promise<void> {
        await this.put(STORES.EXPORTS, exportData);
    }

    /**
     * Delete an export
     */
    async deleteExport(id: string): Promise<void> {
        await this.delete(STORES.EXPORTS, id);
    }

    // ============================================
    // REPORT-SPECIFIC CONVENIENCE METHODS
    // ============================================

    /**
     * Get all reports
     */
    async getAllReports(): Promise<Report[]> {
        return this.getAll<Report>(STORES.REPORTS);
    }

    /**
     * Get a report by ID
     */
    async getReportById(id: string): Promise<Report | undefined> {
        return this.getById<Report>(STORES.REPORTS, id);
    }

    /**
     * Create a new report
     */
    async createReport(report: Report): Promise<void> {
        await this.put(STORES.REPORTS, report);
    }

    /**
     * Update an existing report
     */
    async updateReport(id: string, updates: Partial<Report>): Promise<void> {
        const existing = await this.getReportById(id);
        if (!existing) {
            throw new Error(`Report ${id} not found`);
        }
        const updated: Report = {
            ...existing,
            ...updates,
        };
        await this.put(STORES.REPORTS, updated);
    }

    /**
     * Delete a report
     */
    async deleteReport(id: string): Promise<void> {
        await this.delete(STORES.REPORTS, id);
    }

    // ============================================
    // NOTIFICATION-SPECIFIC CONVENIENCE METHODS
    // ============================================

    /**
     * Get all notifications
     */
    async getAllNotifications(): Promise<Notification[]> {
        return this.getAll<Notification>(STORES.NOTIFICATIONS);
    }

    /**
     * Get a notification by ID
     */
    async getNotificationById(id: string): Promise<Notification | undefined> {
        return this.getById<Notification>(STORES.NOTIFICATIONS, id);
    }

    /**
     * Create a new notification
     */
    async createNotification(notification: Notification): Promise<void> {
        await this.put(STORES.NOTIFICATIONS, notification);
    }

    /**
     * Update an existing notification
     */
    async updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
        const existing = await this.getNotificationById(id);
        if (!existing) {
            throw new Error(`Notification ${id} not found`);
        }
        const updated: Notification = {
            ...existing,
            ...updates,
            readAt: updates.read && !existing.read ? new Date().toISOString() : existing.readAt,
        };
        await this.put(STORES.NOTIFICATIONS, updated);
    }

    /**
     * Delete a notification
     */
    async deleteNotification(id: string): Promise<void> {
        await this.delete(STORES.NOTIFICATIONS, id);
    }

    /**
     * Get unread notifications
     */
    async getUnreadNotifications(): Promise<Notification[]> {
        const allNotifications = await this.getAllNotifications();
        return allNotifications.filter((notif) => !notif.read);
    }

    /**
     * Count unread notifications
     */
    async countUnreadNotifications(): Promise<number> {
        const unread = await this.getUnreadNotifications();
        return unread.length;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        const unreadNotifications = await this.getUnreadNotifications();
        for (const notif of unreadNotifications) {
            await this.updateNotification(notif.id, { read: true });
        }
    }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

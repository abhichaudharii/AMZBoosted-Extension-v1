/**
 * IndexedDB Schema Definitions
 * Defines the structure for local data storage
 */

export const DB_NAME = 'amzboosted-db';
export const DB_VERSION = 3; // Incremented for Price Tracker stores

// Store names
export const STORES = {
    TASKS: 'tasks',
    REPORTS: 'reports',
    SCHEDULES: 'schedules',
    EXPORTS: 'exports',
    NOTIFICATIONS: 'notifications',
    SYNC_METADATA: 'sync_metadata',
    PRICE_TRACKERS: 'price_trackers',
    PRICE_HISTORY: 'price_history',
} as const;

// Task interface (from tasks table)
export interface Task {
    urls: any;
    processedAt: string;
    id: string;
    userId: string;
    toolId: string;
    toolName: string;
    marketplace: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    inputData?: any;
    outputData?: any;
    creditsUsed: number;
    urlCount: number;
    error?: string;
    createdAt: string;
    completedAt?: string;
    syncedAt?: string; // Client-only field for sync tracking
}

// Report interface (from reports table)
export interface Report {
    id: string;
    userId: string;
    taskId?: string;
    toolId?: string;
    name: string;
    toolName: string;
    marketplace?: string;
    data: any;
    fileUrl?: string;
    fileSize?: number;
    createdAt: string;
    expiresAt?: string;
    syncedAt?: string;
}

// Schedule interface (from schedules table)
export interface Schedule {
    id: string;
    userId: string;
    name: string;
    description?: string;
    toolId: string;
    toolName?: string;
    frequency: string;
    cronExpression?: string;
    time: string;
    timezone: string;
    urls: string[];
    marketplace: string;
    enabled: boolean;
    status?: 'active' | 'paused' | 'completed' | 'error';
    notifyOnComplete: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
    runCount: number;
    createdAt: string;
    updatedAt: string;
    syncedAt?: string;
    days?: string[];
    dataPeriod?: string; // 'current_week' | 'yesterday' | 'last_7_days' etc.
    outputFormat?: 'csv' | 'json' | 'excel';
    interval?: number;
    dayOfMonth?: number;
    options?: any;
    retryCount?: number;
}

// Export interface (from exports table)
export interface Export {
    id: string;
    userId: string;
    taskId: string;
    toolId: string;
    toolName: string;
    marketplace: string;
    name: string;
    format: 'csv' | 'json' | 'xlsx';
    fileName: string;
    fileSize?: number;
    recordCount: number;
    source: 'quick_run' | 'manual_schedule' | 'auto_schedule';
    scheduleName?: string;
    downloadPath?: string;
    fileContent?: string; // Base64 encoded or data URL of file content
    downloaded: boolean;
    createdAt: string;
    downloadedAt?: string;
    expiresAt?: string;
    syncedAt?: string;
}

// Notification interface (in-app notifications)
export interface Notification {
    id: string;
    userId: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    relatedId?: string; // taskId, scheduleId, etc.
    relatedType?: 'task' | 'schedule' | 'export' | 'credits';
    createdAt: string;
    readAt?: string;
}

// Sync metadata interface
export interface SyncMetadata {
    storeName: string;
    lastFullSync?: string;
    lastIncrementalSync?: string;
    totalRecords: number;
    syncStatus: 'idle' | 'syncing' | 'error';
    errorMessage?: string;
}

// Price Tracker interface
export interface PriceTracker {
    id: string;
    userId: string; // Keep for compatibility, though local
    asin: string;
    marketplace: string;
    frequency: 'hourly' | 'daily' | 'weekly';
    isActive: boolean;
    enabled?: boolean; // Legacy/Scheduler compatibility
    alertRules: any; // { dropPercent: number, targetPrice: number, etc. }
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    nextRunAt?: string;
    title?: string; // Cache product title
    image?: string; // Cache product image
    currentPrice?: number; // Latest checked price
    currency?: string;
    status?: string; // 'active', 'initializing', 'error'
}

// Price History interface
export interface PriceHistory {
    id: string;
    trackerId: string;
    asin: string;
    marketplace: string;
    price: number;
    currency: string;
    timestamp: string;
    source: 'product_page' | 'buy_box' | 'other';
}

/**
 * Database schema configuration
 */
export const DB_SCHEMA = {
    [STORES.TASKS]: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', unique: false },
            { name: 'toolId', keyPath: 'toolId', unique: false },
            { name: 'status', keyPath: 'status', unique: false },
            { name: 'createdAt', keyPath: 'createdAt', unique: false },
            { name: 'marketplace', keyPath: 'marketplace', unique: false },
        ],
    },
    [STORES.REPORTS]: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', unique: false },
            { name: 'taskId', keyPath: 'taskId', unique: false },
            { name: 'createdAt', keyPath: 'createdAt', unique: false },
            { name: 'toolName', keyPath: 'toolName', unique: false },
        ],
    },
    [STORES.SCHEDULES]: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', unique: false },
            { name: 'toolId', keyPath: 'toolId', unique: false },
            { name: 'enabled', keyPath: 'enabled', unique: false },
            { name: 'nextRunAt', keyPath: 'nextRunAt', unique: false },
        ],
    },
    [STORES.EXPORTS]: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', unique: false },
            { name: 'reportId', keyPath: 'reportId', unique: false },
            { name: 'createdAt', keyPath: 'createdAt', unique: false },
        ],
    },
    [STORES.NOTIFICATIONS]: {
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', unique: false },
            { name: 'read', keyPath: 'read', unique: false },
            { name: 'createdAt', keyPath: 'createdAt', unique: false },
            { name: 'type', keyPath: 'type', unique: false },
        ],
    },
    [STORES.SYNC_METADATA]: {
        keyPath: 'storeName',
        indexes: [],
    },
    [STORES.PRICE_TRACKERS]: {
        keyPath: 'id',
        indexes: [
            { name: 'asin', keyPath: 'asin', unique: false },
            { name: 'marketplace', keyPath: 'marketplace', unique: false },
            { name: 'isActive', keyPath: 'isActive', unique: false },
        ],
    },
    [STORES.PRICE_HISTORY]: {
        keyPath: 'id',
        indexes: [
            { name: 'trackerId', keyPath: 'trackerId', unique: false },
            { name: 'asin', keyPath: 'asin', unique: false },
            { name: 'timestamp', keyPath: 'timestamp', unique: false },
        ],
    },
};

/**
 * Initialize database schema
 */
export function initializeSchema(db: IDBDatabase): void {
    // Create object stores
    Object.entries(DB_SCHEMA).forEach(([storeName, config]) => {
        if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });

            // Create indexes
            config.indexes.forEach((index) => {
                store.createIndex(index.name, index.keyPath, { unique: index.unique });
            });

            console.log(`[IndexedDB] Created store: ${storeName}`);
        }
    });
}

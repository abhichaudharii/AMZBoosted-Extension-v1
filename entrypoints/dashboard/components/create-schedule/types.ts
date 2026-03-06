export interface ScheduleFormData {
    name: string;
    tool: string;
    marketplace: string;
    frequency: string;
    time: string;

    // Dynamic Inputs
    inputs: Record<string, string>; // Store dynamic inputs here (e.g. { keywords: "...", asins: "..." })

    // Legacy/Specific Inputs (keep for backward compat or specific logic if needed, but aim to migrate)
    urls: string;
    keywords: string;

    days: string[];
    dataPeriod: string; // 'current_week' | 'last_week' | 'yesterday' | 'last_7_days' | etc.
    outputFormat: 'csv' | 'json' | 'excel';
    interval: number;
    reportType: string;
    startDate?: string;
    endDate?: string;

    // Integrations / Notifications
    notificationChannels?: string[]; // IDs of selected channels
    notifyOnStart?: boolean;
    notifyOnSuccess?: boolean;
    notifyOnFail?: boolean;

    // Price Tracker Specific
    alertOnPriceDrop?: boolean;
    priceDropThreshold?: number; // % drop threshold
    alertOnStockChange?: boolean;

    googleDriveEnabled?: boolean;
}

export interface Schedule {
    options: any;
    createdAt: any;
    runCount: any;
    id: string;
    name: string;
    toolId: string;
    marketplace: string;
    frequency: string;
    time: string;
    urls: string[];
    status: 'active' | 'paused';
    lastRun?: string;
    nextRun?: string;
    days?: string[]; // For weekly frequency
    dataPeriod?: string; // For SQP and Sales Traffic
    outputFormat?: 'csv' | 'json' | 'excel';
    interval?: number;
    startDate?: string;
    endDate?: string;
    enabled?: boolean;
}

export const DAYS_OF_WEEK = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
];

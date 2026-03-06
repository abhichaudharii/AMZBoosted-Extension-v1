export interface JobStatus {
    id: string;
    url: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    statusMessage?: string;
}

export interface Settings {
    delay: number;
    marketplace: string;
    autoRetry: boolean;
    slowMode: boolean;
    smartScrape: boolean;
    skipCreditConfirmation: boolean;
}

export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

export interface ToolExecutionProgress {
    total: number;
    completed: number;
    failed: number;
    currentUrl?: string;
    statusMessage?: string;
}

export interface ToolRunConfig {
    toolId: string;
    toolName: string;
    marketplace: string;
    urls: string[];
    options?: any;
    scheduleName?: string;
    triggeredBy?: 'manual' | 'auto';
}

export interface ToolRunResult {
    success: boolean;
    runId?: string;
    results?: any[];
    errors?: string[];
    creditsUsed?: number;
    processedCount?: number;
    error?: string;
}

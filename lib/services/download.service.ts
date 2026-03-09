/**
 * Download Service
 * Handles automatic file downloads with proper naming and export tracking
 */

import { indexedDBService } from './indexed-db.service';
import { STORES, type Export } from '@/lib/db/schema';
import { format } from 'date-fns';

interface DownloadOptions {
    taskId: string;
    toolName: string;
    toolId: string;
    marketplace: string;
    data: any[];
    source: 'quick_run' | 'manual_schedule' | 'auto_schedule';
    scheduleName?: string;
    format?: 'csv' | 'json' | 'xlsx';
    preGeneratedContent?: any;
    mimeType?: string;
}

class DownloadService {
    /**
     * Generate filename with proper naming convention
     * Format: ToolName_Marketplace_DateTime_Source.ext
     * Example: ReviewSummary_US_2025-01-28_1430_QuickRun.csv
     */
    public generateFileName(options: DownloadOptions, fileFormat: string): string {
        const {
            toolName,
            marketplace,
            source,
            scheduleName,
        } = options;

        // Clean tool name (remove spaces, special chars)
        const cleanToolName = toolName.replace(/[^a-zA-Z0-9]/g, '');

        // Format date and time
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd_HHmm');

        // Determine source suffix
        let sourceSuffix = '';
        if (source === 'quick_run') {
            sourceSuffix = 'QuickRun';
        } else if (source === 'manual_schedule') {
            sourceSuffix = scheduleName ? `Manual_${scheduleName.replace(/[^a-zA-Z0-9]/g, '')}` : 'ManualSchedule';
        } else if (source === 'auto_schedule') {
            sourceSuffix = scheduleName ? `Auto_${scheduleName.replace(/[^a-zA-Z0-9]/g, '')}` : 'AutoSchedule';
        }

        return `${cleanToolName}_${marketplace}_${dateStr}_${sourceSuffix}.${fileFormat}`;
    }

    /**
     * Convert data to CSV format
     */
    public convertToCSV(data: any[]): string {
        if (!data || data.length === 0) {
            return '';
        }

        // Get all unique keys from all objects
        const allKeys = new Set<string>();
        data.forEach((item) => {
            Object.keys(item).forEach((key) => allKeys.add(key));
        });

        const headers = Array.from(allKeys);

        // Create CSV header
        const csvHeader = headers.map((h) => `"${h}"`).join(',');

        // Create CSV rows
        const csvRows = data.map((item) => {
            return headers
                .map((header) => {
                    const value = item[header];
                    if (value === null || value === undefined) return '""';

                    // Handle objects and arrays
                    if (typeof value === 'object') {
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                    }

                    // Handle strings with commas or quotes
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }

                    return `"${stringValue}"`;
                })
                .join(',');
        });

        return [csvHeader, ...csvRows].join('\n');
    }

    /**
     * Convert data to JSON format
     */
    public convertToJSON(data: any[]): string {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Download file and create export record
     */
    async downloadTaskResults(options: DownloadOptions): Promise<Export | null> {
        try {
            const { taskId, data, format = 'csv' } = options;

            // Validate data availability (unless pre-generated content is provided)
            if ((!data || data.length === 0) && !options.preGeneratedContent) {
                console.log('[Download] No data to download');
                return null;
            }

            // Generate filename
            const fileName = this.generateFileName(options, format);

            // Convert data to requested format
            let content: any;
            let mimeType: string;

            if (options.preGeneratedContent) {
                content = options.preGeneratedContent;
                mimeType = options.mimeType || 'application/octet-stream';
            } else if (format === 'csv') {
                content = this.convertToCSV(data);
                mimeType = 'text/csv';
            } else if (format === 'json') {
                content = this.convertToJSON(data);
                mimeType = 'application/json';
            } else if (format === 'xlsx') {
                // Use optimized Excel utility with dynamic import
                const { generateExcel } = await import('@/lib/utils/excel');
                const cleanName = options.toolName.replace(/[^a-zA-Z0-9]/g, '');
                const excelData = await generateExcel(data, cleanName);
                content = excelData.content;
                mimeType = excelData.mimeType;
                console.log('[Download] XLSX generated successfully using optimized utility');
            } else {
                throw new Error(`Unsupported format: ${format}`);
            }

            // Create blob and data URL for download
            const blob = new Blob([content], { type: mimeType });

            // Convert to data URL (works in service worker context)
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result);
                };
                reader.onerror = () => {
                    reject(new Error('Failed to read blob'));
                };
                reader.readAsDataURL(blob);
            });

            // Create export record first (before download attempt)
            const exportRecord: Export = {
                id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: '', // Will be set from auth context
                taskId,
                toolId: options.toolId,
                toolName: options.toolName,
                marketplace: options.marketplace,
                name: fileName,
                format,
                fileName,
                fileSize: blob.size,
                recordCount: data ? data.length : 0,
                source: options.source,
                scheduleName: options.scheduleName,
                fileContent: dataUrl, // Store the data URL for later download
                downloaded: true,
                createdAt: new Date().toISOString(),
                downloadedAt: new Date().toISOString(),
            };

            // Save to IndexedDB first (so export shows up even if download fails)
            await indexedDBService.put(STORES.EXPORTS, exportRecord);
            console.log('[Download] Export record created:', exportRecord.id);

            // Trigger download directly using chrome.downloads API (works in service worker)
            try {
                await new Promise<void>((resolve, reject) => {
                    chrome.downloads.download(
                        {
                            url: dataUrl,
                            filename: fileName,
                            saveAs: false,
                            conflictAction: 'uniquify',
                        },
                        (downloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error('[Download] Chrome download error:', chrome.runtime.lastError);
                                reject(new Error(chrome.runtime.lastError.message));
                            } else {
                                console.log('[Download] File download started:', fileName, 'ID:', downloadId);
                                resolve();
                            }
                        }
                    );
                });
            } catch (downloadError) {
                // Download failed but export record is saved - user can download manually from exports page
                console.warn('[Download] Could not trigger download, but export saved:', downloadError);
            }

            return exportRecord;
        } catch (error) {
            console.error('[Download] Failed to download file:', error);
            return null;
        }
    }

    /**
     * Get all exports sorted by date (newest first)
     */
    async getAllExports(): Promise<Export[]> {
        try {
            const exports = await indexedDBService.getAll<Export>(STORES.EXPORTS);
            return exports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('[Download] Failed to get exports:', error);
            return [];
        }
    }

    /**
     * Get exports for a specific task
     */
    async getExportsByTask(taskId: string): Promise<Export[]> {
        try {
            const exports = await indexedDBService.getAll<Export>(STORES.EXPORTS);
            return exports
                .filter((exp) => exp.taskId === taskId)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('[Download] Failed to get task exports:', error);
            return [];
        }
    }

    /**
     * Delete export record
     */
    async deleteExport(exportId: string): Promise<void> {
        try {
            await indexedDBService.delete(STORES.EXPORTS, exportId);
            console.log('[Download] Export deleted:', exportId);
        } catch (error) {
            console.error('[Download] Failed to delete export:', error);
            throw error;
        }
    }

    /**
     * Clear old exports (older than 30 days)
     */
    async clearOldExports(daysToKeep: number = 30): Promise<number> {
        try {
            const exports = await this.getAllExports();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            let deletedCount = 0;
            for (const exp of exports) {
                if (new Date(exp.createdAt) < cutoffDate) {
                    await this.deleteExport(exp.id);
                    deletedCount++;
                }
            }

            console.log(`[Download] Cleared ${deletedCount} old exports`);
            return deletedCount;
        } catch (error) {
            console.error('[Download] Failed to clear old exports:', error);
            return 0;
        }
    }
}

export const downloadService = new DownloadService();

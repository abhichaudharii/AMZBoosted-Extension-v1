import { notificationService } from '@/lib/services/notification.service';
import { googleDriveService } from '@/lib/services/integrations/google-drive.service';
import { downloadService } from '@/lib/services/download.service';

interface ToolExecutionOptions {
    toolId: string;
    toolName: string;
    runId: string;
    options: any;
    runner: (options: any, onProgress: (progress: any) => void) => Promise<any>;
    filenamePrefix: string;
    progressMapper?: (progress: any) => any;
}

export async function executeTool({
    toolId,
    toolName,
    runId,
    options,
    runner,
    filenamePrefix,
    progressMapper
}: ToolExecutionOptions) {
    try {
        const result = await runner(
            { ...options, runId },
            (progress) => {
                const mappedProgress = progressMapper ? progressMapper(progress) : progress;
                chrome.runtime.sendMessage({
                    type: 'TOOL_PROGRESS',
                    toolId,
                    progress: mappedProgress
                }).catch(() => { });
            }
        );

        chrome.runtime.sendMessage({
            type: 'TOOL_COMPLETE',
            toolId,
            result
        }).catch(() => { });

        // Notify
        await notificationService.notifyToolComplete({
            toolName: toolName,
            urlCount: result.total || 0,
            successCount: result.successful || 0,
            errorCount: result.failed || 0,
            duration: (Date.now() - (options.startTime || result.startTime || Date.now())) / 1000
        });

        // Google Drive Upload
        // Explicitly skip for Price Tracker as it is an alert-based tool, not a file-output tool
        const shouldUploadToDrive = options.googleDriveEnabled && toolId !== 'price-tracker';

        if (shouldUploadToDrive && result.results && result.results.length > 0) {
            try {
                const format = 'csv';
                const filename = downloadService.generateFileName({
                    taskId: runId || 'unknown',
                    toolName: filenamePrefix,
                    toolId: toolId,
                    marketplace: options.marketplace,
                    data: result.results,
                    source: 'quick_run',
                    scheduleName: options.scheduleName
                }, format);

                const content = downloadService.convertToCSV(result.results);
                await googleDriveService.uploadFile(content, filename, 'text/csv');

                notificationService.notifyIntegrationSync('Google Drive', true);
            } catch (driveError) {
                console.error('Google Drive upload failed:', driveError);
                notificationService.notifyIntegrationSync('Google Drive', false);
            }
        }

    } catch (error) {
        console.error(`${toolName} error:`, error);
        chrome.runtime.sendMessage({
            type: 'TOOL_ERROR',
            toolId,
            error: error instanceof Error ? error.message : 'Unknown error'
        }).catch(() => { });
    }
}

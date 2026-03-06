import { notificationService } from '../notification.service';
import { downloadService } from '../download.service';
import { googleDriveService } from '@/lib/services/integrations/google-drive.service';
import { generateExcel } from '@/lib/utils/excel';

export class ToolDriveService {

    /**
     * Upload results to Google Drive
     */
    async uploadToDrive(
        toolName: string,
        toolId: string,
        marketplace: string,
        results: any[],
        options: any,
        taskId: string,
        config: any
    ) {
        try {
            // Notify: Upload started
            await notificationService.show({
                type: 'info',
                title: 'Uploading to Drive',
                message: `Saving ${toolName} results to Google Drive...`,
                requireInteraction: false
            });

            // Determine output format
            const outputFormat = options.outputFormat || 'csv';
            let content: any = '';
            let mimeType = 'text/csv';
            let extension = 'csv';

            if (outputFormat === 'json') {
                extension = 'json';
                mimeType = 'application/json';
                content = downloadService.convertToJSON(results);
            } else if (outputFormat === 'excel' || outputFormat === 'xlsx') {
                const excelResult = generateExcel(results, toolName);
                extension = excelResult.extension;
                mimeType = excelResult.mimeType;
                content = new Blob([excelResult.content], { type: mimeType });
            } else {
                // Default CSV
                extension = 'csv';
                mimeType = 'text/csv';
                content = downloadService.convertToCSV(results);
            }

            const filename = downloadService.generateFileName({
                taskId,
                toolName: toolName.replace(/\s+/g, ''),
                toolId,
                marketplace,
                data: results,
                source: config.triggeredBy === 'auto' ? 'auto_schedule' : 'manual_schedule',
                scheduleName: config.scheduleName
            }, extension);

            await googleDriveService.uploadFile(content, filename, mimeType);

            // Replicate background notification
            notificationService.notifyIntegrationSync('Google Drive', true);

            // Notify: Upload success
            await notificationService.show({
                type: 'success',
                title: 'Drive Upload Complete',
                message: `File saved to Google Drive successfully.`,
                requireInteraction: false
            });

        } catch (driveError) {
            console.error('[Tool] Google Drive upload failed:', driveError);
            // Only notify failure if explicitly enabled to avoid spam
            if (options.googleDriveEnabled) {
                notificationService.notifyIntegrationSync('Google Drive', false);

                await notificationService.show({
                    type: 'error',
                    title: 'Drive Upload Failed',
                    message: `Could not save to Google Drive. Check your connection.`,
                    requireInteraction: false
                });
            }
        }
    }
}

export const toolDriveService = new ToolDriveService();

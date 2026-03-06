import { ToolExecutionProgress } from '@/lib/types/tool-execution';
import { getToolDefinition } from '@/lib/tool-definitions';

export class ToolBackgroundService {

    isBackgroundTool(toolId: string, toolName?: string) {
        return !!getToolDefinition(toolId, toolName)?.isBackground;
    }

    async executeBackgroundToolDirect(toolId: string, taskId: string, urls: string[], options: any, marketplace: string, onProgress: (progress: ToolExecutionProgress) => void, toolName?: string) {
        const def = getToolDefinition(toolId, toolName);

        if (def && def.execute) {
            const execOptions = {
                ...options,
                runId: taskId,
                marketplace,
                asins: urls,
                asinList: urls,
                weeks: options?.weeks || [],
                searchTerms: options?.searchTerms || []
            };

            // Wrap progress to match expected interface if needed, or rely on mapper in listener
            // But here we are direct, so we assume service calls onProgress with something useful.
            // We can use the def.progressMapper if we want to standardize output here too.
            const mappedOnProgress = (p: any) => {
                const mapped = def.progressMapper ? def.progressMapper(p) : p;
                onProgress({
                    total: mapped.total || 0,
                    completed: mapped.completed || 0,
                    failed: mapped.failed || 0,
                    currentUrl: mapped.currentUrl,
                    statusMessage: mapped.statusMessage
                });
            };

            return await def.execute(execOptions, mappedOnProgress);
        }

        return { results: [], errors: ['Unknown background tool or missing execution logic'] };
    }

    async executeBackgroundToolDelegated(toolId: string, taskId: string, urls: string[], options: any, marketplace: string, toolName?: string) {
        const messageType = 'START_TOOL';
        // Validate tool exists
        if (!getToolDefinition(toolId, toolName)) {
            throw new Error(`Unknown tool ID for background delegation: ${toolId}`);
        }

        const response = await chrome.runtime.sendMessage({
            type: messageType,
            toolId,
            toolName, // Pass name to background so it can also look up robustly
            options: {
                ...options,
                marketplace,
                asins: urls,
                searchTerms: options?.searchTerms || [],
                weeks: options?.weeks || [],
                downloadType: options?.downloadType || 'oneCSV',
                asinList: urls
            },
            runId: taskId
        });

        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to start background task');
        }

        // Wait for completion via message listener
        return await new Promise<any>((resolve, reject) => {
            const listener = (message: any) => {
                if (message.type === 'TOOL_COMPLETE' && message.toolId === toolId) {
                    chrome.runtime.onMessage.removeListener(listener);
                    resolve(message.result);
                }
                if (message.type === 'TOOL_ERROR' && message.toolId === toolId) {
                    chrome.runtime.onMessage.removeListener(listener);
                    reject(new Error(message.error));
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }
}

export const toolBackgroundService = new ToolBackgroundService();

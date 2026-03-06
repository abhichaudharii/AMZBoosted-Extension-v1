import { executeTool } from './utils';
import { getToolDefinition } from '@/lib/tool-definitions';
import { sqpUniversalService } from '@/lib/services/tools/sqp-universal.service'; // Keep for Control Messages logic if needed

// Note: standardRunner and sqpProgressMapper are now defined in tool-definitions or not needed here.


export function handleToolMessage(message: any) {
    const { type, options, runId } = message;

    if (type === 'START_TOOL') {
        const toolDef = getToolDefinition(message.toolId);
        if (toolDef && toolDef.execute) {
            executeTool({
                toolId: toolDef.id,
                toolName: toolDef.name,
                runId,
                options,
                runner: toolDef.execute,
                filenamePrefix: toolDef.filenamePrefix || 'Export',
                progressMapper: toolDef.progressMapper
            });
            return { success: true, status: 'started' };
        }
        return { success: false, error: 'Unknown tool or missing execution logic' };
    }

    // Legacy Support (Optional - can be removed if sure all senders are updated)
    // For now, we rely on START_TOOL. The old cases are removed to enforce the new system.
    return null;
}

export function handleToolControlMessage(message: any) {
    if (message.type === 'GET_ACTIVE_TOOL_RUN') {
        const { toolId } = message;
        const activeRun = sqpUniversalService.getActiveRun(toolId);
        return { success: true, activeRun };
    }

    if (message.type === 'STOP_TOOL') {
        sqpUniversalService.stop(message.runId);
        return { success: true };
    }

    if (message.type === 'PAUSE_TOOL' || message.type === 'RESUME_TOOL') {
        // Not implemented yet
        return { success: true };
    }

    return null;
}

/**
 * Tool Service (Facade)
 * Handles tool execution, credit deduction, and result management
 * Refactored to delegate to core services:
 * - ToolExecutionService: Core execution logic
 * - ToolBrowserService: Browser interactions
 * - ToolDataService: Data processing
 */

import { ToolRunConfig, ToolRunResult } from '@/lib/types/tool-execution';
import { toolExecutionService } from './tool-core/tool-execution.service';

class ToolService {
    /**
     * Get active run state for a tool
     */
    getActiveRun(toolId: string) {
        return toolExecutionService.getActiveRun(toolId);
    }

    /**
     * Execute a tool with permission checking and backend integration
     * Use this for direct tool runs from the UI
     */
    async executeTool(config: ToolRunConfig): Promise<ToolRunResult> {
        return toolExecutionService.executeTool(config);
    }

    /**
     * Execute a tool WITHOUT permission checking
     * Used by scheduler service (which already checked permissions and deducted credits)
     */
    async executeToolWithoutPermissionCheck(
        config: ToolRunConfig,
        taskId: string,
        creditsDeducted: number,
        transactionId?: string
    ): Promise<ToolRunResult> {
        return toolExecutionService.executeToolWithoutPermissionCheck(config, taskId, creditsDeducted, transactionId);
    }

    /**
     * Check if a tool run is active
     */
    isRunActive(runId: string): boolean {
        return toolExecutionService.isRunActive(runId);
    }

    /**
     * Cancel a tool run
     */
    async cancelRun(runId: string): Promise<void> {
        return toolExecutionService.cancelRun(runId);
    }
}

export const toolService = new ToolService();

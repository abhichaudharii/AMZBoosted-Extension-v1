import { schedulerService } from '@/lib/services/scheduler.service';

export async function handleRunSchedule(scheduleId: string) {
    try {
        const result = await schedulerService.runScheduleManually(scheduleId);
        return { success: result.success, result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export function handleCheckScheduleRunning(scheduleId: string) {
    const isRunning = schedulerService.isScheduleRunning(scheduleId);
    return { success: true, isRunning };
}

export function handleGetActiveRuns() {
    const activeRuns = schedulerService.getActiveRuns();
    return { success: true, activeRuns };
}

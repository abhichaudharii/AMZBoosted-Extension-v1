import { useTasks } from '@/lib/hooks/useTasks';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { useExports } from '@/lib/hooks/useExports';
import { useCredits, useLimits } from '@/lib/hooks/useUserData';

export const useDashboardData = () => {
    // IndexedDB hooks
    const { tasks, loading: tasksLoading, getStats: getTaskStats } = useTasks({ autoLoad: true });
    const { schedules, loading: schedulesLoading } = useSchedules({ enabled: true, autoLoad: true });
    const { exports, loading: exportsLoading } = useExports({ autoLoad: true });
    const { credits, loading: creditsLoading } = useCredits();
    const { limits } = useLimits();

    const loading = tasksLoading || schedulesLoading || exportsLoading || creditsLoading;

    return {
        tasks,
        schedules,
        exports,
        credits,
        limits,
        loading,
        getTaskStats,
    };
};

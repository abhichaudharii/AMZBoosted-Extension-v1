import { useState } from 'react';
import { startOfDay, subDays, format } from 'date-fns';

export type Period = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'all';

export const useDashboardAnalytics = (tasks: any[]) => {
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

    const getPeriodLabel = (period: Period): string => {
        const labels: Record<Period, string> = {
            today: 'Today',
            yesterday: 'Yesterday',
            week: 'This Week',
            month: 'This Month',
            quarter: 'This Quarter',
            all: 'All Time',
        };
        return labels[period];
    };

    // Filter tasks by period
    const getFilteredTasks = () => {
        let cutoffDate: Date | null = null;
        const now = new Date();
        const today = startOfDay(now);
        const yesterday = subDays(today, 1);

        switch (selectedPeriod) {
            case 'today':
                cutoffDate = today;
                break;
            case 'yesterday':
                // For yesterday, filter tasks from yesterday only (not including today)
                return tasks.filter((task) => {
                    const taskDate = startOfDay(new Date(task.createdAt));
                    return taskDate.getTime() === yesterday.getTime();
                });
            case 'week':
                cutoffDate = subDays(now, 7);
                break;
            case 'month':
                cutoffDate = subDays(now, 30);
                break;
            case 'quarter':
                cutoffDate = subDays(now, 90);
                break;
            case 'all':
                cutoffDate = null;
                break;
        }

        if (!cutoffDate) return tasks;

        return tasks.filter((task) => new Date(task.createdAt) >= cutoffDate!);
    };

    // Calculate analytics from filtered tasks
    const getAnalytics = () => {
        const filteredTasks = getFilteredTasks();
        const totalRuns = filteredTasks.length;
        const successfulRuns = filteredTasks.filter((t) => t.status === 'completed').length;
        const failed = filteredTasks.filter((t) => t.status === 'failed').length;

        // Dynamic daily stats based on selected period
        let numDays = 7;
        let dateFormat = 'MM/dd';
        let baseDate = new Date();

        switch (selectedPeriod) {
            case 'today':
                numDays = 24; // Show hourly for today
                dateFormat = 'HH:mm';
                baseDate = startOfDay(new Date());
                break;
            case 'yesterday':
                numDays = 24; // Show hourly for yesterday
                dateFormat = 'HH:mm';
                baseDate = startOfDay(subDays(new Date(), 1));
                break;
            case 'week':
                numDays = 7;
                dateFormat = 'MM/dd';
                break;
            case 'month':
                numDays = 30;
                dateFormat = 'MM/dd';
                break;
            case 'quarter':
                numDays = 90;
                dateFormat = 'MM/dd';
                break;
            case 'all':
                numDays = 30; // Show last 30 days for "all time"
                dateFormat = 'MM/dd';
                break;
        }

        const dailyStats = Array.from({ length: numDays }, (_, i) => {
            let date: Date;

            if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
                // For today/yesterday, show hourly breakdown
                date = new Date(baseDate);
                date.setHours(i);
            } else {
                // For other periods, show daily breakdown
                date = subDays(new Date(), numDays - 1 - i);
            }

            const dayTasks = filteredTasks.filter((t) => {
                const taskDate = new Date(t.createdAt);

                if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
                    // Match by hour for today/yesterday
                    return taskDate.getFullYear() === date.getFullYear() &&
                        taskDate.getMonth() === date.getMonth() &&
                        taskDate.getDate() === date.getDate() &&
                        taskDate.getHours() === date.getHours();
                } else {
                    // Match by day for other periods
                    return taskDate.toDateString() === date.toDateString();
                }
            });

            return {
                date: format(date, dateFormat),
                totalRuns: dayTasks.length,
                successfulRuns: dayTasks.filter((t) => t.status === 'completed').length,
                failedRuns: dayTasks.filter((t) => t.status === 'failed').length,
            };
        });

        // Marketplace breakdown
        const marketplaceCounts: Record<string, number> = {};
        filteredTasks.forEach((task) => {
            const market = (task.marketplace || 'Unknown').toUpperCase();
            marketplaceCounts[market] = (marketplaceCounts[market] || 0) + 1;
        });

        const marketplaceBreakdown = Object.entries(marketplaceCounts)
            .map(([marketplace, count]) => ({
                marketplace,
                count,
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalRuns,
            successfulRuns,
            failed,
            dailyStats,
            marketplaceBreakdown,
        };
    };

    const analytics = getAnalytics();

    const successRate = analytics.totalRuns > 0
        ? Math.round((analytics.successfulRuns / analytics.totalRuns) * 100)
        : 0;

    return {
        selectedPeriod,
        setSelectedPeriod,
        getPeriodLabel,
        analytics,
        successRate
    };
};

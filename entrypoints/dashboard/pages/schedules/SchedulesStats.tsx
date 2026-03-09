import React from 'react';
import { Play, Pause, Clock, Calendar } from 'lucide-react';
import { UISchedule } from './useSchedulesLogic';
import { format } from 'date-fns';
import { PremiumToolStats, StatItem } from "../../components/PremiumToolStats";

interface SchedulesStatsProps {
    schedules: UISchedule[];
}

export const SchedulesStats: React.FC<SchedulesStatsProps> = ({ schedules }) => {
    const total = schedules.length;
    const active = schedules.filter(s => s.enabled).length;
    const paused = schedules.filter(s => !s.enabled).length;
    
    // Logic for Next Running Schedule
    const nextRunSchedule = schedules
        .filter(s => s.enabled && s.nextRun)
        .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())[0];

    const statsList: StatItem[] = [
        {
            title: "Total Automation",
            value: total,
            icon: Calendar,
            colorClass: "text-gray-400 font-bold",
            bgClass: "bg-white/5 border border-white/10"
        },
        {
            title: "Active Tasks",
            value: active,
            subtitle: `${((active / (total || 1)) * 100).toFixed(0)}% of total`,
            icon: Play,
            colorClass: "text-emerald-500 font-bold",
            bgClass: "bg-emerald-500/10 border border-emerald-500/20"
        },
        {
            title: "Paused",
            value: paused,
            icon: Pause,
            colorClass: "text-amber-500 font-bold",
            bgClass: "bg-amber-500/10 border border-amber-500/20"
        },
        {
            title: "Next Scheduled",
            value: nextRunSchedule?.nextRun ? format(new Date(nextRunSchedule.nextRun), 'HH:mm') : '-',
            subtitle: nextRunSchedule?.name || 'No upcoming tasks',
            icon: Clock,
            colorClass: "text-blue-500 font-bold",
            bgClass: "bg-blue-500/10 border border-blue-500/20"
        }
    ];

    return (
        <div className="mb-8">
            <PremiumToolStats stats={statsList} />
        </div>
    );
};

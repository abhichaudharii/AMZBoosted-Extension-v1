import React from "react";
import { PlayCircle, XCircle, Zap, Percent } from "lucide-react";
import { PremiumToolStats, StatItem } from "../../components/PremiumToolStats";

interface ActivityStatsProps {
  stats: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    totalCredits: number;
    successRate: string;
  };
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({ stats }) => {
  const statsList: StatItem[] = [
    {
        title: "Total Executions",
        value: stats.total,
        icon: PlayCircle,
        colorClass: "text-gray-400 font-bold",
        bgClass: "bg-white/5 border border-white/10"
    },
    {
        title: "Success Rate",
        value: `${stats.successRate}%`,
        subtitle: `${stats.completed} runs successful`,
        icon: Percent,
        colorClass: "text-emerald-500 font-bold",
        bgClass: "bg-emerald-500/10 border border-emerald-500/20"
    },
    {
        title: "Failed Runs",
        value: stats.failed,
        subtitle: stats.total ? `${((stats.failed / stats.total) * 100).toFixed(1)}% failure` : "0% failure",
        icon: XCircle,
        colorClass: "text-red-500 font-bold",
        bgClass: "bg-red-500/10 border border-red-500/20"
    },
    {
        title: "Credits Utilized",
        value: stats.totalCredits,
        subtitle: stats.total ? `${(stats.totalCredits / stats.total).toFixed(1)} / run` : "0 / run",
        icon: Zap,
        colorClass: "text-amber-500 font-bold",
        bgClass: "bg-amber-500/10 border border-amber-500/20"
    }
  ];

  return (
    <div className="mb-8">
        <PremiumToolStats stats={statsList} />
    </div>
  );
};

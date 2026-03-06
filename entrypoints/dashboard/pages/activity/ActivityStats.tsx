import React from "react";
import { PlayCircle, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
      <PremiumStatCard
        title="Total Runs"
        value={stats.total}
        icon={PlayCircle}
        colorClass="text-gray-400"
        bgClass="bg-white/5"
      />
      <PremiumStatCard
        title="Completed"
        value={stats.completed}
        subtitle={`${stats.successRate}% rate`}
        icon={CheckCircle2}
        colorClass="text-emerald-500"
        bgClass="bg-emerald-500/10"
      />
      <PremiumStatCard
        title="Failed"
        value={stats.failed}
        subtitle={`${
          stats.total
            ? ((stats.failed / stats.total) * 100).toFixed(1)
            : "0"
        }% rate`}
        icon={XCircle}
        colorClass="text-red-500"
        bgClass="bg-red-500/10"
      />
      <PremiumStatCard
        title="Processing"
        value={stats.processing}
        icon={Clock}
        colorClass="text-[#FF6B00]"
        bgClass="bg-[#FF6B00]/10"
      />
      <div className="md:col-span-2 lg:col-span-2">
        <PremiumStatCard
          title="Total Credits Used"
          value={stats.totalCredits}
          subtitle={`Avg ${
            stats.total
              ? (stats.totalCredits / stats.total).toFixed(1)
              : "0"
          } / run`}
          icon={Zap}
          colorClass="text-amber-500"
          bgClass="bg-amber-500/10"
          wide
        />
      </div>
    </div>
  );
};

function PremiumStatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass, wide }: any) {
  return (
      <Card className={cn(
        "bg-[#0A0A0B]/60 backdrop-blur-md border-white/5 overflow-hidden relative group hover:border-white/10 transition-all",
         wide ? "h-full" : ""
      )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {title}
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg transition-colors", bgClass, colorClass)}>
                  <Icon className="h-4 w-4" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="flex items-baseline gap-2">
                 <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                  {value}
                 </div>
                 {subtitle && (
                   <div className="text-xs text-gray-500 font-mono">
                     {subtitle}
                   </div>
                 )}
              </div>
          </CardContent>
      </Card>
  );
}

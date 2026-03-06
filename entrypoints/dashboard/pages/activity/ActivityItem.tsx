import React from "react";
import {
  ChevronRight,
  Hash,
  Zap,
  Check,
  X,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Task } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { getFlagByMarketplace, getSourceBadge, getStatusConfig } from "./utils";

interface ActivityItemProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  task,
  index,
  onClick,
}) => {
  const FlagComponent = getFlagByMarketplace(task.marketplace);
  const statusConfig = getStatusConfig(task.status);

  // Map status colors to our dark theme palette
  const getStatusColor = (color: string) => {
      switch (color) {
          case 'green': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
          case 'red': return 'text-red-500 bg-red-500/10 border-red-500/20';
          case 'blue': return 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20'; // Processing -> Orange
          default: return 'text-gray-400 bg-white/5 border-white/10';
      }
  };

  const statusStyle = getStatusColor(statusConfig.color);

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer",
        "bg-[#0A0A0B]/60 backdrop-blur-xl border-white/5 hover:border-white/10",
        "hover:shadow-[0_0_20px_-5px_rgba(255,107,0,0.1)] hover:-translate-y-0.5"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* STATUS ICON */}
      <div className="flex-shrink-0 flex items-center">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
            statusStyle
          )}
        >
          {React.cloneElement(statusConfig.icon as React.ReactElement, { className: "w-5 h-5" })}
        </div>
      </div>

      {/* MIDDLE CONTENT */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Tool name */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white text-base group-hover:text-[#FF6B00] transition-colors">
            {task.toolName}
          </h3>
          {getSourceBadge(task)}
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
           {/* Time */}
          <div className="flex items-center gap-1.5">
             <Clock className="w-3.5 h-3.5" />
             <span className="font-mono">{format(new Date(task.createdAt), "MMM dd, HH:mm")}</span>
          </div>

          {/* Credits */}
          {task.creditsUsed > 0 && (
            <div className="flex items-center gap-1 text-amber-500">
                <Zap className="w-3.5 h-3.5" /> 
                <span className="font-medium">{task.creditsUsed}</span>
            </div>
          )}

           {/* Metrics */}
           {(task.outputData?.successful > 0 || task.outputData?.failed > 0) && (
               <div className="flex items-center gap-3 border-l border-white/10 pl-3">
                   {task.outputData?.successful > 0 && (
                       <span className="flex items-center gap-1 text-emerald-500">
                           <Check className="w-3 h-3" /> {task.outputData.successful}
                       </span>
                   )}
                   {task.outputData?.failed > 0 && (
                       <span className="flex items-center gap-1 text-red-500">
                           <X className="w-3 h-3" /> {task.outputData.failed}
                       </span>
                   )}
               </div>
           )}

           {/* Marketplace */}
           {task.marketplace && (
             <div className="flex items-center gap-1 ml-auto border-l border-white/10 pl-3">
                {FlagComponent && <FlagComponent className="w-3.5 h-3.5 rounded-sm" />}
                <span className="uppercase tracking-wider opacity-70">{task.marketplace}</span>
             </div>
           )}
        </div>
      </div>

      {/* CHEVRON */}
      <div className="flex items-center pl-2">
        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

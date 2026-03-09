import React from "react";
import {
  ChevronRight,
  Zap,
  Check,
  X,
  Clock,
} from "lucide-react";
import { Task } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
        "group relative flex items-center gap-5 p-5 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden",
        "bg-[#0A0A0B]/40 backdrop-blur-md border-white/5 hover:border-primary/30",
        "hover:shadow-[0_0_40px_-10px_rgba(255,107,0,0.15)] hover:-translate-y-1"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Ambient Background Glow on Hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* STATUS ICON */}
      <div className="flex-shrink-0 flex items-center relative z-10">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-lg shadow-black/20",
            statusStyle
          )}
        >
          {React.cloneElement(statusConfig.icon as React.ReactElement, { className: "w-6 h-6" })}
        </div>
      </div>

      {/* MIDDLE CONTENT */}
      <div className="flex-1 min-w-0 space-y-2 relative z-10">
        {/* Tool name */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300 tracking-tight">
            {task.toolName}
          </h3>
          <div className="opacity-80 scale-90 origin-left">
            {getSourceBadge(task)}
          </div>
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
           {/* Time */}
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors">
             <Clock className="w-4 h-4 opacity-50" />
             <span className="font-mono tracking-tighter">{format(new Date(task.createdAt), "MMM dd, HH:mm")}</span>
          </div>

          {/* Credits */}
          {task.creditsUsed > 0 && (
            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                <Zap className="w-3.5 h-3.5" /> 
                <span className="font-black tracking-tight">{task.creditsUsed} Credits</span>
            </div>
          )}

           {/* Metrics */}
           {(task.outputData?.successful > 0 || task.outputData?.failed > 0) && (
               <div className="flex items-center gap-4 border-l border-white/10 pl-5">
                   {task.outputData?.successful > 0 && (
                       <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                           <Check className="w-3.5 h-3.5" /> 
                           <span className="font-bold">{task.outputData.successful}</span>
                       </span>
                   )}
                   {task.outputData?.failed > 0 && (
                       <span className="flex items-center gap-1.5 text-red-500 bg-red-500/5 px-2 py-0.5 rounded-lg border border-red-500/10">
                           <X className="w-3.5 h-3.5" /> 
                           <span className="font-bold">{task.outputData.failed}</span>
                       </span>
                   )}
               </div>
           )}

           {/* Marketplace */}
           {task.marketplace && (
             <div className="flex items-center gap-2 ml-auto border-l border-white/10 pl-5">
                {FlagComponent && <FlagComponent className="w-4 h-4 rounded-sm shadow-sm" />}
                <span className="uppercase tracking-widest font-black text-[10px] text-gray-500 group-hover:text-gray-400">{task.marketplace}</span>
             </div>
           )}
        </div>
      </div>

      {/* CHEVRON */}
      <div className="flex items-center pl-2 relative z-10">
        <div className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 group-hover:bg-primary/20 transition-all duration-500 group-hover:translate-x-1">
            <ChevronRight className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

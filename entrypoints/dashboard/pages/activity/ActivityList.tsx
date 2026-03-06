import React from "react";
import { TrendingUp, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/db/schema";
import { ActivityItem } from "./ActivityItem";
import { cn } from "@/lib/utils";

interface ActivityListProps {
  paginatedTasks: Task[];
  pageState: {
    statusFilter: string;
  };
  updatePageState: (newState: { statusFilter: string }) => void;
  onSelectTask: (task: Task) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  paginatedTasks,
  pageState,
  updatePageState,
  onSelectTask,
}) => {
  if (paginatedTasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-[#1A1A1C]/30 rounded-2xl border border-dashed border-white/10 mt-4">
            <div className="p-4 rounded-full bg-white/5 mb-4">
                <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Activities Found</h3>
            <p className="text-gray-400 mb-6 text-center max-w-sm">
              {pageState.statusFilter !== "all"
                ? `No items match your filters.`
                : "Your activity log is empty. Automated tasks and manual runs will appear here."}
            </p>
            {pageState.statusFilter !== "all" && (
                <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                onClick={() => updatePageState({ statusFilter: "all" })}
                >
                Clear Filters
                </Button>
            )}
        </div>
      );
  }

  return (
    <div className="space-y-3 mt-4">
         {paginatedTasks.map((task, index) => (
            <ActivityItem
            key={task.id}
            task={task}
            index={index}
            onClick={onSelectTask}
            />
        ))}
    </div>
  );
};

import React, { useState } from "react";
import {
  Activity as ActivityIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/hooks/useTasks";
import { Task } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { usePageState } from "@/lib/hooks/usePersistedState";
import { ActivityStats } from "./activity/ActivityStats";
import { ActivityFilters } from "./activity/ActivityFilters";
import { ActivityList } from "./activity/ActivityList";
import { ActivityPagination } from "./activity/ActivityPagination";
import { ActivityDetailsDialog } from "./activity/ActivityDetailsDialog";

export const ActivityPage: React.FC = () => {
  const { tasks, loading, refresh } = useTasks({ autoLoad: true });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [pageState, updatePageState] = usePageState("tasks", {
    toolFilter: "all",
    statusFilter: "all",
    marketplaceFilter: "all",
    searchQuery: "",
    itemsPerPage: 10,
    creditsFilter: "all",
    page: 1,
  });

  // Stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    processing: tasks.filter((t) => t.status === "processing").length,
    totalCredits: tasks.reduce((sum, t) => sum + (t.creditsUsed || 0), 0),
    successRate: tasks.length
      ? (
          (tasks.filter((t) => t.status === "completed").length /
            tasks.length) *
          100
        ).toFixed(1)
      : "0",
  };

  const uniqueTools: { id: string; name: string }[] = Array.from(
    new Map<string, string>(tasks.map((t) => [t.toolId, t.toolName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredTasks = tasks.filter((task) => {
    // Status Filter
    const matchesStatus =
      pageState.statusFilter === "all" ||
      task.status === pageState.statusFilter;

    // Tool Filter
    const matchesTool =
      pageState.toolFilter === "all" || task.toolId === pageState.toolFilter;

    // Marketplace Filter
    const matchesMarketplace =
      pageState.marketplaceFilter === "all" ||
      task.marketplace === pageState.marketplaceFilter;

    // Credits Filter
    const matchesCredits =
      pageState.creditsFilter === "all" ||
      (pageState.creditsFilter === "0" && (task.creditsUsed || 0) === 0) ||
      (pageState.creditsFilter === "1-10" &&
        (task.creditsUsed || 0) >= 1 &&
        (task.creditsUsed || 0) <= 10) ||
      (pageState.creditsFilter === "10+" && (task.creditsUsed || 0) >= 10);

    // Search Filter
    const search = pageState.searchQuery.toLowerCase();
    const matchesSearch =
      !search ||
      task.toolName.toLowerCase().includes(search) ||
      task.toolId.toLowerCase().includes(search) ||
      task.marketplace?.toLowerCase().includes(search);

    return (
      matchesStatus &&
      matchesTool &&
      matchesMarketplace &&
      matchesCredits &&
      matchesSearch
    );
  });

  const startIdx = (pageState.page - 1) * pageState.itemsPerPage;
  const paginatedTasks = filteredTasks.slice(
    startIdx,
    startIdx + pageState.itemsPerPage
  );
  const totalPages = Math.ceil(filteredTasks.length / pageState.itemsPerPage);

  const uniqueMarketplaces = [
    ...new Set(tasks.map((t) => t.marketplace).filter(Boolean)),
  ] as string[];

  // Handle loading saved view
  const handleLoadView = (filters: Record<string, any>) => {
    updatePageState(filters);
  };

  // Get current filters for saving
  const currentFilters = {
    searchQuery: pageState.searchQuery,
    toolFilter: pageState.toolFilter,
    statusFilter: pageState.statusFilter,
    marketplaceFilter: pageState.marketplaceFilter,
    creditsFilter: pageState.creditsFilter,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF6B00] border-t-transparent mx-auto"></div>
              <ActivityIcon className="w-6 h-6 text-[#FF6B00] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400 font-medium">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground">
      {/* Ambient Background - Relaxed Neutral Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-slate-500/2 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-400/2 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                    <ActivityIcon className="w-3 h-3 text-[#FF6B00]" />
                    <span>System Events</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                Activity <span className="text-[#FF6B00]">Log</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                Track all your task runs, schedule executions, and system events.
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
                <RotateCcw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#FF6B00]")} />
                Refresh
            </Button>
        </div>

        {/* Stats Cards */}
        <ActivityStats stats={stats} />

        {/* Filters and Search */}
        <ActivityFilters
            pageState={pageState}
            updatePageState={updatePageState}
            uniqueTools={uniqueTools}
            uniqueMarketplaces={uniqueMarketplaces}
            currentFilters={currentFilters}
            onLoadView={handleLoadView}
        />

        {/* Activity List */}
        <ActivityList
            paginatedTasks={paginatedTasks}
            pageState={pageState}
            updatePageState={updatePageState}
            onSelectTask={setSelectedTask}
        />

        {/* Pagination */}
        <ActivityPagination
            pageState={pageState}
            totalPages={totalPages}
            updatePageState={updatePageState}
        />

        {/* Task Details Dialog */}
        <ActivityDetailsDialog
            selectedTask={selectedTask}
            onClose={() => setSelectedTask(null)}
        />
      </div>
    </div>
  );
};

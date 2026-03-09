import React, { useMemo } from 'react';
import { Play, Calendar, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { DataTable } from '@/components/data-table/DataTable';

import { useSchedulesLogic } from './schedules/useSchedulesLogic';
import { getSchedulesColumns } from './schedules/columns';
import { SchedulesStats } from './schedules/SchedulesStats';
import { SchedulesFilters } from './schedules/SchedulesFilters';
import { SchedulesDialogs } from './schedules/SchedulesDialogs';

// --- MAIN PAGE COMPONENT ---
export const SchedulesPage: React.FC = () => {
  const logic = useSchedulesLogic();
  
  // Define Columns with Premium Actions
  const columns = useMemo(() => getSchedulesColumns({
    toggling: logic.toggling,
    deleting: logic.deleting,
    runningSchedules: logic.runningSchedules,
    onRun: logic.handleRunSchedule,
    onToggle: logic.handleToggleSchedule,
    onEdit: logic.handleEditSchedule,
    onDelete: logic.handleDeleteSingleSchedule,
  }), [logic.toggling, logic.deleting, logic.runningSchedules]);

  if (logic.loading && logic.allSchedules.length === 0) {
    return <PageLoading text="Loading schedules..." subtitle="Fetching your automated tasks" />;
  }

  // Calculate unique marketplaces for the filter (logic hook might provide this, but recalculating is safe)
  const marketplaces = Array.from(new Set(logic.mappedSchedules.map(s => s.marketplace).filter(Boolean))).sort();

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground pb-24">
       {/* Ambient Background - Relaxed Neutral Glow */}
       <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-slate-500/2 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-400/2 rounded-full blur-[120px] pointer-events-none" />

       <div className="max-w-7xl mx-auto space-y-8 relative z-10">
           {/* Header */}
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
               <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                       <Calendar className="w-3 h-3 text-[#FF6B00]" />
                       <span>Automation</span>
                   </div>
                   <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                   Scheduled <span className="text-[#FF6B00]">Tasks</span>
                   </h1>
                   <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                   Manage and monitor your automated schedules.
                   </p>
               </div>
                <Button onClick={logic.handleCreateNew} className="bg-primary hover:bg-primary/90 text-black font-black shadow-lg shadow-primary/20 px-8 rounded-2xl transition-all duration-300 hover:-translate-y-0.5">
                     <Play className="w-4 h-4 mr-2" />
                     New Schedule
                </Button>
           </div>

           {/* Stats */}
           <SchedulesStats schedules={logic.mappedSchedules} />

           {/* Filters */}
            <div className="space-y-4">
               <SchedulesFilters 
                    pageState={logic.pageState}
                    updatePageState={logic.updatePageState}
                    tools={logic.tools}
                    marketplaces={marketplaces}
                    onClearFilters={logic.handleClearFilters}
                    onLoadView={logic.handleLoadView}
                />
            </div>

           {/* TABLE VIEW (Premium) */}
           <div className="rounded-xl border border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md overflow-hidden">
                <DataTable
                    columns={columns}
                    data={logic.filteredSchedules}
                    searchPlaceholder="Search schedules..."
                    showColumnVisibility={false}
                    bulkActions={(selectedRows, clearSelection) => (
                        <div className="flex items-center gap-2">
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => logic.handleBulkPauseResume(selectedRows, clearSelection)}
                                className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-white"
                             >
                                <Play className="mr-1 h-3 w-3" />
                                Pause/Resume
                             </Button>
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => logic.handleBulkDuplicate(selectedRows, clearSelection)}
                                className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-white"
                             >
                                <Copy className="mr-1 h-3 w-3" />
                                Duplicate
                             </Button>
                             <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => logic.handleBulkDelete(selectedRows, clearSelection)}
                                className="h-7 text-xs hover:bg-red-600/90"
                             >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Delete
                             </Button>
                        </div>
                    )}
                    columnVisibility={logic.pageState.columnVisibility}
                    onColumnVisibilityChange={(vis) => logic.updatePageState({ columnVisibility: vis })}
                    floatingBar={true}
                    selectOnRowClick={true}
                />
           </div>

            {/* Dialogs */}
            <SchedulesDialogs 
                 {...logic}
                 allSchedules={logic.allSchedules}
             />
        </div>
    </div>
  );
};

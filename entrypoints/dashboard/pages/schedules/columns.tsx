import { ColumnDef } from '@tanstack/react-table';
import { UISchedule } from './useSchedulesLogic';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Play, Pause, Edit, Trash2, Clock, MoreHorizontal, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getFlagByMarketplace } from '../activity/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ColumnsProps {
  toggling: string | null;
  deleting: boolean;
  runningSchedules: Set<string>;
  onRun: (schedule: UISchedule) => void;
  onToggle: (schedule: UISchedule) => void;
  onEdit: (schedule: UISchedule) => void;
  onDelete: (schedule: UISchedule) => void;
}

export const getSchedulesColumns = ({
  runningSchedules,
  onRun,
  onToggle,
  onEdit,
  onDelete,
}: ColumnsProps): ColumnDef<UISchedule>[] => [

  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="text-xs font-semibold text-gray-400 hover:text-white pl-0"
      >
        Name
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
        const schedule = row.original;
        const Flag = getFlagByMarketplace(schedule.marketplace);

        return (
            <div className="flex flex-col gap-1.5 py-1">
                <span className="font-bold text-[15px] text-white group-hover:text-primary transition-colors duration-300 tracking-tight">{row.getValue('name')}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 inline-block font-bold group-hover:bg-white/10">
                        {schedule.tool}
                    </span>
                     {schedule.marketplace && (
                         <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 group-hover:bg-white/10">
                            {Flag && <Flag className="w-3 h-3 rounded-sm shadow-sm" />}
                            <span className="uppercase tracking-widest font-black opacity-80">{schedule.marketplace}</span>
                         </div>
                    )}
                </div>
            </div>
        )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const enabled = row.original.enabled;
      return (
        <Badge
          variant="outline"
          className={cn(
            'capitalize text-[10px] h-5 px-2 border font-black tracking-widest rounded-lg',
            enabled
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/20 shadow-md'
              : 'bg-gray-500/10 text-gray-500 border-gray-500/30'
          )}
        >
          <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse", enabled ? "bg-emerald-500" : "bg-gray-500")} />
          {enabled ? 'Active' : 'Paused'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'outputFormat',
    header: 'Format',
    cell: ({ row }) => {
        const format = (row.original.outputFormat || 'csv').toLowerCase();
        const colors: Record<string, string> = {
            csv: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
            json: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            excel: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            xlsx: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        };
        const colorClass = colors[format] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';

        return (
            <span className={cn(
                "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                colorClass
            )}>
                {format}
            </span>
        );
    },
  },
  {
    accessorKey: 'frequency',
    header: 'Frequency',
    cell: ({ row }) => {
        const schedule = row.original;
        // Fallback for debugging
        if (!schedule?.frequency) return <span className="text-gray-500">Unknown</span>;

        const days = schedule.days?.map(d => d.slice(0, 3)).join(', ') || 'Every Day';
        
        return (
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 cursor-help hover:text-white transition-colors w-fit">
                            <Clock className="w-3 h-3" />
                            <span className="capitalize">{schedule.frequency}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1A1A1C] border-white/10 p-3 space-y-2 z-50">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-white capitalize flex items-center gap-2">
                               {schedule.frequency} Schedule
                            </p>
                            <div className="h-px bg-white/10 my-1" />
                            
                            {/* Time Details */}
                            {schedule.time && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock className="w-3 h-3 text-[#FF6B00]" />
                                    <span>{schedule.time} {schedule.timezone || 'UTC'}</span>
                                </div>
                            )}

                             {/* Days Details (for weekly) */}
                            {schedule.frequency.toLowerCase() === 'weekly' && schedule.days && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Calendar className="w-3 h-3 text-emerald-500" />
                                    <span>{days}</span>
                                </div>
                            )}

                             {/* Monthly Details */}
                             {schedule.frequency.toLowerCase() === 'monthly' && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Calendar className="w-3 h-3 text-amber-500" />
                                    <span>Day {row.original.dayOfMonth || 1} of month</span>
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    },
  },
  {
    accessorKey: 'nextRun',
    header: 'Run Time',
    cell: ({ row }) => {
        const next = row.original.nextRun;
        const last = row.original.lastRun;
        
        return (
            <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase w-8">Next:</span>
                    <span className={cn(
                        "font-medium",
                        next ? "text-white/90" : "text-gray-500"
                    )}>
                        {next ? format(new Date(next), 'MMM dd, HH:mm') : 'Pending'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase w-8">Last:</span>
                    <span className="text-gray-400">
                         {last ? format(new Date(last), 'MMM dd, HH:mm') : 'Never'}
                    </span>
                </div>
            </div>
        );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const schedule = row.original;
      const isRunning = runningSchedules.has(schedule.id);

      return (
          <div className="flex items-center justify-end gap-2">
            <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRun(schedule);
                }}
                disabled={isRunning}
                className={cn(
                    "h-8 text-[11px] px-3 gap-1.5 border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all duration-300 font-bold rounded-xl",
                    isRunning ? "text-primary border-primary/40 bg-primary/10 shadow-[0_0_15px_-5px_rgba(255,107,0,0.3)]" : "text-gray-300"
                )}
            >
               {isRunning ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
               {isRunning ? 'Running' : 'Run Now'}
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-7 w-7 p-0 text-gray-500 hover:text-white">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1A1A1C] border-white/10 text-gray-300">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(schedule);
                    }}
                    className="focus:bg-white/5 focus:text-white cursor-pointer"
                >
                    {schedule.enabled ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {schedule.enabled ? 'Pause Schedule' : 'Resume Schedule'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(schedule);
                    }} 
                    className="focus:bg-white/5 focus:text-white cursor-pointer"
                >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(schedule);
                    }}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Schedule
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];

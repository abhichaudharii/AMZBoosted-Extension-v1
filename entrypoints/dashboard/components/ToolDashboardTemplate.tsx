import React from 'react';
import { Play, Download, Lock, BarChart3, Activity, Zap, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, PieChart } from '@/components/charts';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { format, isToday, isYesterday, isAfter, subWeeks, subMonths, subQuarters, formatDistanceToNow } from 'date-fns';
import { ProcessedURL } from '@/lib/types/entities';
import { createSortableHeader } from '@/components/data-table/columns-helper';
import { useFeatures } from '@/lib/hooks/useFeatures';
import { PremiumToolStats } from './PremiumToolStats';
import { PageLoading } from '@/components/ui/page-loading';
import { useTasks } from '@/lib/hooks/useTasks';

import { useSchedules } from '@/lib/hooks/useSchedules';
import { usePageState } from '@/lib/hooks/usePersistedState';
import { Task } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { ToolPageLayout } from './ToolPageLayout';
import { Badge } from '@/components/ui/badge';

export interface ToolDashboardConfig {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  category: string;
}

type ColorTheme = 'violet' | 'indigo' | 'blue' | 'emerald' | 'amber' | 'cyan' | 'rose' | 'slate';

const getThemeForCategory = (category: string = ''): ColorTheme => {
  const lower = category.toLowerCase();
  
  if (lower.includes('customer')) return 'rose';
  if (lower.includes('ai') || lower.includes('intelligence')) return 'violet';
  if (lower.includes('list') || lower.includes('optimiz')) return 'blue';
  if (lower.includes('price') || lower.includes('money') || lower.includes('finance')) return 'emerald';
  if (lower.includes('research') || lower.includes('market') || lower.includes('keyword')) return 'amber';
  if (lower.includes('bulk') || lower.includes('data') || lower.includes('export')) return 'cyan';
  if (lower.includes('alert') || lower.includes('monitor') || lower.includes('track')) return 'rose';
  
  if (lower.includes('advert') || lower.includes('ppc')) return 'amber';
  if (lower.includes('business') || lower.includes('fulfill')) return 'blue';
  if (lower.includes('analyt')) return 'emerald';
  
  return 'slate';
};

const getColorStyles = (theme: ColorTheme = 'slate') => {
  const styles: Record<ColorTheme, {
    iconBg: string;
    iconColor: string;
    badge: string;
  }> = {
    violet: { iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/10' },
    indigo: { iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/10' },
    blue: { iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/10' },
    emerald: { iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/10' },
    amber: { iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/10' },
    rose: { iconBg: 'bg-rose-500/10', iconColor: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/10' },
    cyan: { iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/10' },
    slate: { iconBg: 'bg-slate-800', iconColor: 'text-slate-400', badge: 'bg-slate-800 text-slate-400 border-white/5' },
  };
  return styles[theme] || styles.slate;
};

interface ToolDashboardTemplateProps {
  config: ToolDashboardConfig;
  onBack?: () => void;
  hiddenTabs?: string[];
  hideRecentItems?: boolean;
  onRunNow?: () => void;
  hideHeader?: boolean;
  hideCharts?: boolean;
  runLabel?: string;
  children?: React.ReactNode;
}

export const ToolDashboardTemplate: React.FC<ToolDashboardTemplateProps> = ({ 
  config, 
  onBack,
  hideRecentItems = false,
  onRunNow,
  hideHeader = false,
  hideCharts = false,
  runLabel = 'Start New Run',
  children
}) => {
  const Icon = config.icon;
  const [pageState, setPageState] = usePageState(`tool_dashboard_${config.id}`, {
    timeRange: 'all' as 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'all'
  });
  const timeRange = pageState.timeRange;
  const setTimeRange = (range: typeof timeRange) => setPageState({ timeRange: range });

  const { loading: featuresLoading, isToolEnabled } = useFeatures();
  const { tasks } = useTasks({ toolId: config.id, autoLoad: true });

  const { schedules } = useSchedules({ toolId: config.id, autoLoad: true });

  const theme = getThemeForCategory(config.category);
  const styles = getColorStyles(theme);

  const filterDate = (dateString: string | undefined) => {
    if (!dateString || timeRange === 'all') return true;
    const date = new Date(dateString);
    const now = new Date();

    switch (timeRange) {
      case 'today': return isToday(date);
      case 'yesterday': return isYesterday(date);
      case 'week': return isAfter(date, subWeeks(now, 1));
      case 'month': return isAfter(date, subMonths(now, 1));
      case 'quarter': return isAfter(date, subQuarters(now, 1));
      default: return true;
    }
  };

  const typedTasks = tasks as unknown as Task[];
  const filteredTasks = typedTasks.filter(t => filterDate(t.processedAt || t.createdAt));


  const lastTask = typedTasks.length > 0 
    ? typedTasks.reduce((latest, current) => {
        const latestTime = new Date(latest.processedAt || latest.createdAt).getTime();
        const currentTime = new Date(current.processedAt || current.createdAt).getTime();
        return currentTime > latestTime ? current : latest;
      })
    : null;
  
  const lastRunText = lastTask 
    ? `${formatDistanceToNow(new Date(lastTask.processedAt || lastTask.createdAt), { addSuffix: true })}` 
    : undefined;

  const totalRuns = filteredTasks.length;
  const successfulRuns = filteredTasks.filter(t => t.status === 'completed').length;
  const failedRuns = filteredTasks.filter(t => t.status === 'failed').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  const creditsUsed = filteredTasks.reduce((sum, t) => sum + (t.creditsUsed || 0), 0);
  const activeSchedules = schedules.filter(s => s.enabled).length;
  const totalSchedules = schedules.length;


  const recentURLs: ProcessedURL[] = filteredTasks.slice(0, 50).map((task) => ({
    ...task,
    url: task.urls?.[0] || 'Multiple Items',
  } as any));

  const pieData = [
    { name: 'Success', value: successfulRuns, fill: '#16a34a' },
    { name: 'Failed', value: failedRuns, fill: '#dc2626' },
    { name: 'Processing', value: filteredTasks.filter(t => t.status === 'processing').length, fill: '#2563eb' }
  ].filter(d => d.value > 0);

  const dailyData = filteredTasks.reduce((acc, task) => {
    const dateStr = task.processedAt || task.createdAt;
    if (!dateStr) return acc;
    const date = format(new Date(dateStr), 'MMM dd');
    if (!acc[date]) {
      acc[date] = { date, totalRuns: 0, credits: 0 };
    }
    acc[date].totalRuns++;
    acc[date].credits += (task.creditsUsed || 0);
    return acc;
  }, {} as Record<string, any>);
  
  const chartData = Object.values(dailyData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ).slice(-30); 

  const toolEnabled = isToolEnabled(config.id);

  if (featuresLoading) {
    return <PageLoading text={`Loading ${config.name}...`} subtitle="Fetching tool configuration and availability" />;
  }

  if (!toolEnabled) {
    return (
       <ToolPageLayout
            title={config.name}
            icon={Icon}
            iconColorClass={styles.iconColor}
            showBackButton={!!onBack}
        >
          <div className="flex justify-center py-12">
            <Card className="max-w-2xl w-full bg-[#0A0A0B]/60 backdrop-blur-sm border-white/5">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-white/5 w-16 h-16 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-gray-500" />
                    </div>
                    <CardTitle className="text-2xl text-white">{config.name} is Locked</CardTitle>
                    <CardDescription className="text-base mt-2 text-gray-400">
                      This tool is not available on your current plan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4 pb-8">
                    <Button 
                        size="lg"
                        className="bg-[#FF6B00] hover:bg-[#FF8533] text-white"
                        onClick={() => window.location.href = '/billing'}
                    >
                        Upgrade to Unlock
                    </Button>
                </CardContent>
            </Card>
          </div>
       </ToolPageLayout>
    );
  }

  const urlColumns: ColumnDef<ProcessedURL>[] = [
    {
      accessorKey: 'url',
      header: 'Input / Query',
      cell: ({ row }) => <div className="text-xs font-mono max-w-[300px] truncate">{row.getValue('url')}</div>,
    },
    {
      accessorKey: 'marketplace',
      header: 'Market',
      cell: ({ row }) => <Badge variant="outline" className="text-xs border-white/10">{row.getValue('marketplace')}</Badge>,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const className = status === 'completed' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 
                            status === 'failed' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 
                            'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20';
          return (
            <Badge variant="outline" className={cn("text-xs capitalize border-transparent font-medium", className)}>
              {status}
            </Badge>
          );
        },
    },
    {
      accessorKey: 'creditsUsed',
      header: 'Credits',
      cell: ({ row }) => {
        const task = row.original as any;
        return <span className="text-xs font-medium text-gray-400">{task.creditsUsed || 0}</span>;
      }
    },
    {
      accessorKey: 'processedAt',
      header: createSortableHeader('Date'),
      cell: ({ row }) => {
        const date = row.getValue('processedAt');
        if (!date) return <div className="text-xs text-gray-500">-</div>;
        return <div className="text-xs text-gray-300">{format(new Date(date as string), 'MMM dd, HH:mm')}</div>;
      },
    },
  ];

  const stats = [
    { 
        title: "Credits Used", 
        value: creditsUsed.toLocaleString(), 
        icon: Zap, 
        subtitle: timeRange === 'all' ? 'Lifetime limit' : 'Used this period',
        colorClass: "text-blue-500",
        bgClass: "bg-blue-500/10"
    },
    {
        title: "Total Requests",
        value: totalRuns.toLocaleString(),
        icon: Activity,
        subtitle: "Processed items",
         colorClass: "text-blue-500",
        bgClass: "bg-blue-500/10"
    },
    {
        title: "Success Rate",
        value: totalRuns > 0 ? `${successRate}%` : '-',
        icon: TrendingUp,
        subtitle: "Completion rate",
        colorClass: successRate >= 90 ? "text-green-500" : "text-yellow-500",
        bgClass: successRate >= 90 ? "bg-green-500/10" : "bg-yellow-500/10"
    },
    {
        title: "Active Schedules",
        value: `${activeSchedules}/${totalSchedules}`,
        icon: Calendar,
        subtitle: "Enabled / Total",
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-500/10"
    }
  ];

  return (
    <ToolPageLayout
        title={`${config.name}`}
        subtitle={config.description}
        icon={Icon}
        lastActive={lastRunText}
        iconColorClass={styles.iconColor}
        badge="Tool Dashboard"
        showBackButton={!!onBack}
        actions={
            !hideHeader && (
                <div className="flex gap-3">
                    <Button 
                        size="lg" 
                        className="gap-2 shadow-[0_0_20px_-5px_rgba(255,107,0,0.4)] hover:shadow-[0_0_25px_-5px_rgba(255,107,0,0.5)] bg-[#FF6B00] hover:bg-[#FF8533] text-white border-0 transition-all font-semibold" 
                        onClick={onRunNow}
                    >
                    <Play className="h-4 w-4 fill-current" />
                    {runLabel}
                    </Button>
                </div>
            )
        }
    >
      <Tabs defaultValue={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="space-y-8">
        
        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <PremiumToolStats stats={stats} className="w-full" />
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4 mt-8">
            <h3 className="text-lg font-bold text-white tracking-tight">Analytics & History</h3>
            <TabsList className="bg-white/5 p-1 border border-white/10 h-9">
                <TabsTrigger value="today" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 h-7 text-xs">Today</TabsTrigger>
                <TabsTrigger value="yesterday" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 h-7 text-xs">Yesterday</TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 h-7 text-xs">Week</TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 h-7 text-xs">Month</TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 h-7 text-xs">All Time</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value={timeRange} className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Charts Section */}
            {!hideCharts && (
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 shadow-none rounded-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <BarChart3 className="h-4 w-4 text-[#FF6B00]" />
                        Usage Activity
                    </CardTitle>
                    <CardDescription className="text-gray-500">Daily volume and credit consumption</CardDescription>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                    <LineChart
                        data={chartData}
                        xAxisKey="date"
                        lines={[
                            { dataKey: 'totalRuns', name: 'Requests', stroke: '#3b82f6' }, // Blue 500
                            { dataKey: 'credits', name: 'Credits', stroke: '#f97316' }, // Orange 500
                        ]}
                        height={300}
                    />
                    ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-sm text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                        No activity data available for this period
                    </div>
                    )}
                </CardContent>
                </Card>

                <Card className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 shadow-none rounded-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">Status Distribution</CardTitle>
                    <CardDescription className="text-gray-500">Success vs Failure rates</CardDescription>
                </CardHeader>
                <CardContent>
                    {totalRuns > 0 && pieData.length > 0 ? (
                    <PieChart data={pieData} height={300} />
                    ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-sm text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                         <Activity className="h-8 w-8 mb-2 opacity-20" />
                        No status data available
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
            )}

            {/* Recent Items Table - Wrapped in Premium Container */}
            {!hideRecentItems && (
                <div className="rounded-xl border border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                         <div>
                            <h3 className="font-bold text-white">Recent Activity</h3>
                         </div>
                         <Button variant="outline" size="sm" onClick={() => {}} className="h-7 text-xs border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10">
                            <Download className="h-3 w-3 mr-2" />
                            Export Log
                        </Button>
                    </div>
                    <DataTable
                        columns={urlColumns}
                        data={recentURLs}
                        showColumnVisibility={false}
                        pageSize={10}
                    />
                </div>
            )}
        </TabsContent>
      </Tabs>

      {children}
    </ToolPageLayout>
  );
};

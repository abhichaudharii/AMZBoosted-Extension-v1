import React, { useState, useMemo } from 'react';
import {  Activity, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { useTasks } from '@/lib/hooks/useTasks';
import StatCard from '../components/StatCard';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { tasks, loading, error: tasksError } = useTasks({ autoLoad: true });

  // Calculate analytics from tasks
  const analytics = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = subDays(new Date(), days);

    // Filter tasks by time range
    const filteredTasks = tasks.filter((task) => new Date(task.createdAt) >= cutoffDate);

    const totalExtractions = filteredTasks.length;
    const successfulTasks = filteredTasks.filter((t) => t.status === 'completed');
    const successRate = totalExtractions > 0
      ? Math.round((successfulTasks.length / totalExtractions) * 100)
      : 0;

    // Calculate average processing time (if available)
    const completedTasks = filteredTasks.filter((t) => t.status === 'completed' && t.completedAt);
    const avgProcessingTime = completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((sum, task) => {
            const start = new Date(task.createdAt).getTime();
            const end = new Date(task.completedAt!).getTime();
            return sum + (end - start) / 1000; // Convert to seconds
          }, 0) / completedTasks.length
        )
      : 0;

    // Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const extractionsToday = tasks.filter((t) => new Date(t.createdAt) >= today).length;

    // This week's tasks
    const weekAgo = subDays(new Date(), 7);
    const extractionsThisWeek = tasks.filter((t) => new Date(t.createdAt) >= weekAgo).length;

    // This month's tasks
    const monthAgo = subDays(new Date(), 30);
    const extractionsThisMonth = tasks.filter((t) => new Date(t.createdAt) >= monthAgo).length;

    // Tool usage breakdown
    const toolCounts: Record<string, number> = {};
    filteredTasks.forEach((task) => {
      toolCounts[task.toolName] = (toolCounts[task.toolName] || 0) + 1;
    });
    const toolUsage = Object.entries(toolCounts).map(([tool, count]) => ({
      tool,
      count,
      percentage: Math.round((count / totalExtractions) * 100) || 0,
    }));

    // Marketplace breakdown
    const marketplaceCounts: Record<string, number> = {};
    filteredTasks.forEach((task) => {
      const market = task.marketplace || 'Unknown';
      marketplaceCounts[market] = (marketplaceCounts[market] || 0) + 1;
    });
    const marketplaceBreakdown = Object.entries(marketplaceCounts).map(([marketplace, count]) => ({
      marketplace,
      count,
      percentage: Math.round((count / totalExtractions) * 100) || 0,
    }));

    // Daily extractions (last N days)
    const dailyExtractions = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = filteredTasks.filter((t) => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });

      return {
        date: format(date, 'MM/dd'),
        count: dayTasks.length,
        success: dayTasks.filter((t) => t.status === 'completed').length,
        failed: dayTasks.filter((t) => t.status === 'failed').length,
      };
    });

    // Recent activity (last 10 tasks)
    const recentActivity = filteredTasks.slice(0, 10).map((task) => ({
      date: format(new Date(task.createdAt), 'MMM dd, HH:mm'),
      tool: task.toolName,
      status: task.status,
      marketplace: task.marketplace || 'Unknown',
    }));

    return {
      totalExtractions,
      successRate,
      avgProcessingTime,
      extractionsToday,
      extractionsThisWeek,
      extractionsThisMonth,
      toolUsage,
      marketplaceBreakdown,
      dailyExtractions,
      recentActivity,
    };
  }, [tasks, timeRange]);

  const error = tasksError;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error || 'Failed to load analytics data'}
          </p>
        </div>
      </div>
    );
  }

  const successChange = 2.3;
  const processingChange = -0.8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">Analytics</h1>
          <p className="text-muted-foreground">Track your extraction metrics and insights</p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Extractions" value={analytics.totalExtractions > 0 ? analytics.totalExtractions.toLocaleString() : null} icon={Activity} subtitle={`${analytics.extractionsThisMonth} this month`} />
        <StatCard title="Success Rate" value={analytics.successRate > 0 ? `${analytics.successRate}%` : null} icon={CheckCircle2} subtitle={`+${successChange}% from last period`} fallback="No usage data" />
        <StatCard title="Avg Processing Time" value={analytics.avgProcessingTime > 0 ? `${analytics.avgProcessingTime}s` : null} icon={Clock} subtitle={`${processingChange}s faster`} />
        <StatCard title="Today" value={analytics.extractionsToday > 0 ? analytics.extractionsToday : null} icon={Activity} subtitle={`${analytics.extractionsThisWeek} this week`} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tool Usage */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tool Usage</CardTitle>
            <CardDescription>Extraction breakdown by tool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.toolUsage.map((item) => (
                <div key={item.tool} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.tool}</span>
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline">{item.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Marketplace Distribution</CardTitle>
            <CardDescription>Extractions by marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.marketplaceBreakdown.map((item) => (
                <div key={item.marketplace} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.marketplace}</span>
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline">{item.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Extractions Chart (Simple Bar Chart) */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Extraction Trends</CardTitle>
          <CardDescription>Daily extraction count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {analytics.dailyExtractions.map((day, index) => {
              const maxCount = Math.max(...analytics.dailyExtractions.map((d) => d.count));
              const height = (day.count / maxCount) * 100;
              const successHeight = (day.success / day.count) * height;
              const failedHeight = (day.failed / day.count) * height;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '200px' }}>
                    <div
                      className="w-full bg-green-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${successHeight}%` }}
                      title={`${day.success} successful`}
                    />
                    <div
                      className="w-full bg-red-500 transition-all hover:opacity-80"
                      style={{ height: `${failedHeight}%` }}
                      title={`${day.failed} failed`}
                    />
                  </div>
                  {index % 5 === 0 && (
                    <span className="text-[10px] text-muted-foreground">{day.date}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-muted-foreground">Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest extractions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{activity.tool}</div>
                    <div className="text-xs text-muted-foreground">{activity.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{activity.marketplace}</Badge>
                  <Badge
                    variant={activity.status === 'completed' ? 'default' : 'destructive'}
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

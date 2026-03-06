import React from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { useDashboardData } from '@/entrypoints/dashboard/hooks/useDashboardData';
import { useDashboardAnalytics } from '@/entrypoints/dashboard/hooks/useDashboardAnalytics';
import { useDashboardSettings } from '@/entrypoints/dashboard/hooks/useDashboardSettings';
import { DashboardHeader } from './dashboard-home/components/DashboardHeader';
import { DashboardStats } from './dashboard-home/components/DashboardStats';
import { DashboardCharts } from './dashboard-home/components/DashboardCharts';
import { QuickActions } from './dashboard-home/components/QuickActions';
import { RecentActivity } from './dashboard-home/components/RecentActivity';
import { RecentExports } from './dashboard-home/components/RecentExports';
import { PlanUsage } from './dashboard-home/components/PlanUsage';
import { UpcomingSchedules } from './dashboard-home/components/UpcomingSchedules';

export const DashboardHome: React.FC = () => {
  // Hooks for data, analytics and settings
  const { tasks, schedules, exports, credits, limits, loading } = useDashboardData();
  const { selectedPeriod, setSelectedPeriod, getPeriodLabel, analytics, successRate } = useDashboardAnalytics(tasks);
  const { isSectionVisible, toggleSection, sectionLabels } = useDashboardSettings();

  // Show loading state
  if (loading) {
    return <PageLoading text="Loading dashboard..." subtitle="Fetching your analytics and stats" />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground pb-24">
       {/* Ambient Background */}
       <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />

       <div className="max-w-7xl mx-auto space-y-8 relative z-10 w-full">
          {/* Header */}
          <DashboardHeader 
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            sectionLabels={sectionLabels}
            isSectionVisible={isSectionVisible}
            toggleSection={toggleSection}
          />

          {/* Stats Grid */}
          {isSectionVisible('stats') && (
            <DashboardStats 
              analytics={analytics}
              schedules={schedules}
              limits={limits}
              credits={credits}
              successRate={successRate}
              periodLabel={getPeriodLabel(selectedPeriod)}
            />
          )}

          {/* Usage Charts */}
          {isSectionVisible('charts') && (
            <DashboardCharts analytics={analytics} periodLabel={getPeriodLabel(selectedPeriod)} />
          )}

          {/* Quick Actions */}
          {isSectionVisible('quickActions') && (
            <QuickActions />
          )}

          {/* Recent Activity Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            {isSectionVisible('recentActivity') && (
              <RecentActivity tasks={tasks} />
            )}

            {/* Recent Exports */}
            {isSectionVisible('recentExports') && (
              <RecentExports exports={exports} />
            )}
          </div>

          {/* Plan Usage & Schedules */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plan Usage */}
            {isSectionVisible('planUsage') && (
              <PlanUsage credits={credits} schedules={schedules} limits={limits} />
            )}

            {/* Upcoming Schedules */}
            {isSectionVisible('upcomingSchedules') && (
              <UpcomingSchedules schedules={schedules} />
            )}
          </div>
       </div>
    </div>
  );
};

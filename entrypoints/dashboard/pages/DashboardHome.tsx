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
import { WhatsNew } from './dashboard-home/components/WhatsNew';

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
       {/* Ambient Background - Neutral/Blue Calm */}
       <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none" />

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

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Usage Charts - Prominent positioning */}
            {isSectionVisible('charts') && (
              <div className="lg:col-span-3">
                <DashboardCharts analytics={analytics} periodLabel={getPeriodLabel(selectedPeriod)} />
              </div>
            )}

            {/* What's New Section - Flowing Sidebar-style component */}
            {isSectionVisible('whatsNew') && (
              <div className="lg:col-span-1">
                <WhatsNew />
              </div>
            )}

            {/* Recent Activity - High density main component */}
            {isSectionVisible('recentActivity') && (
              <div className="lg:col-span-2">
                <RecentActivity tasks={tasks} />
              </div>
            )}

            {/* Quick Actions */}
            {isSectionVisible('quickActions') && (
              <div className="lg:col-span-1">
                <QuickActions />
              </div>
            )}

            {/* Recent Exports */}
            {isSectionVisible('recentExports') && (
              <div className="lg:col-span-2">
                <RecentExports exports={exports} />
              </div>
            )}

            {/* Plan Usage */}
            {isSectionVisible('planUsage') && (
              <div className="lg:col-span-1">
                <PlanUsage credits={credits} schedules={schedules} limits={limits} />
              </div>
            )}

            {/* Upcoming Schedules */}
            {isSectionVisible('upcomingSchedules') && (
              <div className="lg:col-span-1">
                <UpcomingSchedules schedules={schedules} />
              </div>
            )}
          </div>
       </div>
    </div>
  );
};

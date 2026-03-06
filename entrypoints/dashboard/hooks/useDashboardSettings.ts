import { useState, useEffect } from 'react';
import { secureStorage } from '@/lib/storage/secure-storage';

export type DashboardSection =
    | 'stats'
    | 'charts'
    | 'quickActions'
    | 'recentActivity'
    | 'recentExports'
    | 'planUsage'
    | 'upcomingSchedules'
    | 'whatsNew';

export interface DashboardSettings {
    visibleSections: DashboardSection[];
    sectionOrder: DashboardSection[];
}

const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
    visibleSections: ['stats', 'charts', 'quickActions', 'recentActivity', 'recentExports', 'planUsage', 'upcomingSchedules', 'whatsNew'],
    sectionOrder: ['stats', 'charts', 'quickActions', 'recentActivity', 'recentExports', 'planUsage', 'upcomingSchedules', 'whatsNew'],
};

export const useDashboardSettings = () => {
    const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);

    // Load dashboard settings from local storage
    useEffect(() => {
        secureStorage.get(['dashboardSettings']).then((result) => {
            if (result.dashboardSettings) {
                setDashboardSettings(result.dashboardSettings);
            }
        });
    }, []);

    // Save dashboard settings to local storage
    const saveDashboardSettings = async (settings: DashboardSettings) => {
        setDashboardSettings(settings);
        await secureStorage.set({ dashboardSettings: settings });
    };

    // Toggle section visibility
    const toggleSection = (section: DashboardSection) => {
        const newSettings = {
            ...dashboardSettings,
            visibleSections: dashboardSettings.visibleSections.includes(section)
                ? dashboardSettings.visibleSections.filter(s => s !== section)
                : [...dashboardSettings.visibleSections, section],
        };
        saveDashboardSettings(newSettings);
    };

    const isSectionVisible = (section: DashboardSection) => {
        return dashboardSettings.visibleSections.includes(section);
    };

    const sectionLabels: Record<DashboardSection, string> = {
        stats: 'Statistics Cards',
        charts: 'Analytics Charts',
        quickActions: 'Quick Actions',
        recentActivity: 'Recent Activity',
        recentExports: 'Recent Exports',
        planUsage: 'Plan Usage',
        upcomingSchedules: 'Upcoming Schedules',
        whatsNew: "What's New",
    };

    return {
        dashboardSettings,
        toggleSection,
        isSectionVisible,
        sectionLabels
    };
};

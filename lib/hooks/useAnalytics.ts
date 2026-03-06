/**
 * useAnalytics Hook
 * React hook for tracking events
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/lib/services/analytics.service';
import type { EventType } from '@/lib/types/analytics';

export function useAnalytics() {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location]);

  const track = useCallback(async (type: EventType, data?: Record<string, any>) => {
    await analyticsService.track(type, data);
  }, []);

  const trackToolRun = useCallback(async (toolId: string, marketplace: string, urlCount: number) => {
    await analyticsService.trackToolRun({
      toolId,
      marketplace,
      urlCount,
      delay: 0,
      startTime: new Date().toISOString(),
      status: 'running',
      creditsUsed: urlCount,
    });
  }, []);

  const trackToolComplete = useCallback(
    async (toolId: string, success: boolean, creditsUsed: number, duration: number) => {
      await analyticsService.trackToolComplete(toolId, success, creditsUsed, duration);
    },
    []
  );

  const trackExport = useCallback(async (toolId: string, format: string, rowCount: number) => {
    await analyticsService.trackExport(toolId, format, rowCount);
  }, []);

  const trackIntegration = useCallback(
    async (action: 'connected' | 'synced' | 'disconnected', integrationName: string) => {
      await analyticsService.trackIntegration(action, integrationName);
    },
    []
  );

  const trackSchedule = useCallback(
    async (
      action: 'created' | 'executed' | 'updated' | 'deleted',
      scheduleId: string,
      toolId: string
    ) => {
      await analyticsService.trackSchedule(action, scheduleId, toolId);
    },
    []
  );

  const trackFeature = useCallback(async (feature: string, data?: Record<string, any>) => {
    await analyticsService.trackFeature(feature, data);
  }, []);

  const trackUpgrade = useCallback(async (source: string) => {
    await analyticsService.trackUpgradeIntent(source);
  }, []);

  const trackLimitReached = useCallback(
    async (limitType: string, currentValue: number, maxValue: number) => {
      await analyticsService.trackLimitReached(limitType, currentValue, maxValue);
    },
    []
  );

  return {
    track,
    trackToolRun,
    trackToolComplete,
    trackExport,
    trackIntegration,
    trackSchedule,
    trackFeature,
    trackUpgrade,
    trackLimitReached,
  };
}

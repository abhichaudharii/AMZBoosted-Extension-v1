/**
 * useCredits Hook
 * React hook for credit balance and limits
 */

import { useState, useEffect } from 'react';
import { creditsService } from '@/lib/services/credits.service';
import type { Credits, PlanLimits } from '@/lib/types/auth';

export function useCredits() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [warningLevel, setWarningLevel] = useState<'none' | 'low' | 'critical' | 'depleted'>(
    'none'
  );

  useEffect(() => {
    loadCredits();

    // Listen for credit changes
    const handleStorageChange = (changes: any) => {
      if (changes.credits) {
        setCredits(changes.credits.newValue || null);
      }
      if (changes.limits) {
        setLimits(changes.limits.newValue || null);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    updateWarningLevel();
  }, [credits]);

  const loadCredits = async () => {
    try {
      const [creditsData, limitsData] = await Promise.all([
        creditsService.getCredits(),
        creditsService.getLimits(),
      ]);
      setCredits(creditsData);
      setLimits(limitsData);
    } finally {
      setLoading(false);
    }
  };

  const updateWarningLevel = async () => {
    const level = await creditsService.getCreditWarningLevel();
    setWarningLevel(level);
  };

  const refresh = async () => {
    await creditsService.refresh();
    await loadCredits();
  };

  const canPerformAction = async (
    action: 'tool_run' | 'schedule' | 'integration' | 'export' | 'webhook' | 'api_key',
    params?: { urlCount?: number }
  ) => {
    return await creditsService.canPerformAction(action, params);
  };

  const hasEnoughCredits = async (required: number) => {
    return await creditsService.hasEnoughCredits(required);
  };

  const calculateCredits = (urlCount: number) => {
    return creditsService.calculateCreditsRequired(urlCount);
  };

  const getMessage = async () => {
    return await creditsService.getCreditMessage();
  };

  return {
    credits,
    limits,
    loading,
    warningLevel,
    refresh,
    canPerformAction,
    hasEnoughCredits,
    calculateCredits,
    getMessage,
  };
}

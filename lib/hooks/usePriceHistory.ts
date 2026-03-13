import { useState, useEffect, useCallback } from 'react';
import { priceTrackerService } from '../services/tools/price-tracker.service';
import { PriceHistory } from '../db/schema';

export function usePriceHistory(trackerId: string | null) {
    const [history, setHistory] = useState<PriceHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!trackerId) {
            setHistory([]);
            return;
        }
        try {
            setLoading(true);
            const data = await priceTrackerService.getHistory(trackerId);
            // Sort ascending so charts render left-to-right chronologically
            const sorted = [...data].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setHistory(sorted);
            setError(null);
        } catch (err) {
            console.error('[usePriceHistory] Failed to fetch history:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [trackerId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { history, loading, error, refresh: fetchHistory };
}

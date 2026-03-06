
import { useState, useEffect, useCallback } from 'react';
import { priceTrackerService } from '../services/tools/price-tracker.service';
import { PriceTracker } from '../db/schema';

export function usePriceTrackers() {
    const [trackers, setTrackers] = useState<PriceTracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrackers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await priceTrackerService.getTrackers();
            setTrackers(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch trackers:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrackers();
    }, [fetchTrackers]);

    return { trackers, loading, error, refresh: fetchTrackers };
}

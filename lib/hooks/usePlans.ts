import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export interface PricingPlan {
    id: string;
    name: string;
    price: number; // Monthly price
    originalPrice?: number;
    annualPrice?: number;
    originalAnnualPrice?: number;
    description: string;
    features: string[];
    popular?: boolean;
    color?: string; // e.g. 'blue', 'emerald'
    gradient?: string; // CSS class
    icon?: string; // Icon name string
}

export function usePlans() {
    const [plans, setPlans] = useState<PricingPlan[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getPlans();
            if (data) {
                setPlans(data);
            } else {
                setError('Failed to load plans');
            }
        } catch (err: any) {
            console.error('Failed to load plans:', err);
            setError(err.message || 'Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    return { plans, loading, error, refresh: () => apiClient.getPlans(true).then(setPlans) };
}

import { IAPIClient } from '../types';

export const BillingService = {
    async post<T>(client: IAPIClient, endpoint: string, body?: any): Promise<T> {
        const result = await client.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
        if (result.success && result.data !== undefined) {
            return result.data;
        }
        throw new Error(result.error || 'Request failed');
    }
};

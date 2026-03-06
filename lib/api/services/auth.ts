import type {
    Session,
    AuthResponse,
    LoginCredentials,
    RegisterData,
} from '@/lib/types/auth';
import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';

export const AuthService = {
    async login(client: IAPIClient, credentials: LoginCredentials): Promise<AuthResponse> {
        const result = await client.request<Session>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (result.success && result.data) {
            await client.setAccessToken(result.data.accessToken);
            await secureStorage.set({
                session: result.data,
                user: result.data.user,
            });
            return { success: true, session: result.data };
        }

        return { success: false, error: result.error };
    },

    async register(client: IAPIClient, data: RegisterData): Promise<AuthResponse> {
        const result = await client.request<Session>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success && result.data) {
            await client.setAccessToken(result.data.accessToken);
            await secureStorage.set({
                session: result.data,
                user: result.data.user,
            });
            return { success: true, session: result.data };
        }

        return { success: false, error: result.error };
    },

    async logout(client: IAPIClient): Promise<void> {
        await client.request('/auth/logout', { method: 'POST' });
        await client.clearAccessToken();
        await secureStorage.remove(['session', 'user', 'userTimestamp', 'credits', 'creditsTimestamp', 'limits', 'limitsTimestamp']);
    },

    async validateSession(client: IAPIClient): Promise<{ valid: boolean; session?: Session }> {
        const result = await client.request<Session>('/auth/session', {
            method: 'GET',
        });

        if (result.success && result.data) {
            await secureStorage.set({
                session: result.data,
                user: result.data.user,
            });
            return { valid: true, session: result.data };
        }

        // Session invalid, clear local data
        await client.clearAccessToken();
        await secureStorage.remove(['session', 'user', 'userTimestamp', 'credits', 'creditsTimestamp', 'limits', 'limitsTimestamp']);
        return { valid: false };
    }
};

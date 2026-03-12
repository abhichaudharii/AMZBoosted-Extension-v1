/**
 * API Client for Backend Communication
 * All requests to amzboosted.com backend
 */

import type {
    User,
    Session,
    Credits,
    PlanLimits,
    UsageStats,
    AuthResponse,
    LoginCredentials,
    RegisterData,
} from '@/lib/types/auth';
import type { SubscriptionStatus } from '@/lib/types/subscription';
import type { AnalyticsEvent, ToolRunEvent } from '@/lib/types/analytics';
import { secureStorage } from '../storage/secure-storage';
import API_CONFIG, { getEndpointURL } from './config';

// Re-export types for backward compatibility
export { APIErrorType } from './types';
import { APIErrorType, APIError, IAPIClient, APIResponse } from './types';

// Import Services
import { AuthService } from './services/auth';
import { UserService } from './services/user';
import { ToolsService } from './services/tools';
import { AnalyticsService } from './services/analytics';
import { IntegrationsService } from './services/integrations';
import { FeaturesService } from './services/features';
import { SettingsService } from './services/settings';
import { SchedulesService } from './services/schedules';
import { BillingService } from './services/billing';
import { TasksService, type StartTaskRequest, type StartTaskResponse, type FinalizeTaskRequest, type FinalizeTaskResponse, type TaskStatusResponse } from './services/tasks';
export type { StartTaskRequest, StartTaskResponse, FinalizeTaskRequest, FinalizeTaskResponse, TaskStatusResponse };

const REQUEST_TIMEOUT = API_CONFIG.timeout;
const MAX_RETRIES = API_CONFIG.maxRetries;
const RETRY_DELAYS = API_CONFIG.retryDelays;

// Re-export interface if needed by consumers
export type { APIError };

class APIClient implements IAPIClient {
    private accessToken: string | null = null;
    private isOnline: boolean = navigator.onLine;
    private tokenLoadPromise: Promise<void>;

    constructor() {
        this.tokenLoadPromise = this.loadToken();
        this.setupNetworkListeners();
        // Initialize connection state
        this.updateConnectionState(this.isOnline ? 'online' : 'offline');
    }

    private setupNetworkListeners() {
        // Use standard window events for online/offline status
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.updateConnectionState('online');
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.updateConnectionState('offline');
            });
        }
    }

    private async updateConnectionState(status: 'online' | 'offline' | 'slow', apiAvailable: boolean = true) {
        try {
            await secureStorage.set({
                connectionState: {
                    status,
                    lastChecked: new Date().toISOString(),
                    apiAvailable: status === 'offline' ? false : apiAvailable,
                    latency: 0
                }
            });
        } catch (e) {
            console.error('[API] Failed to update connection state', e);
        }
    }

    async loadToken(): Promise<void> {
        // Create a new promise for this load operation
        this.tokenLoadPromise = (async () => {
            const result = await secureStorage.get('accessToken');
            this.accessToken = result.accessToken || null;
            if (this.accessToken) {
                console.log('[API] Access token loaded from storage');
            } else {
                console.log('[API] No access token found in storage');
            }
        })();

        await this.tokenLoadPromise;
    }

    public async setAccessToken(token: string): Promise<void> {
        this.accessToken = token;
        await secureStorage.set({ accessToken: token });
    }

    public async clearAccessToken(): Promise<void> {
        this.accessToken = null;
        await secureStorage.remove('accessToken');
    }



    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private classifyError(response: Response, data: any): APIError {
        const statusCode = response.status;

        if (statusCode === 401 || statusCode === 403) {
            return {
                type: APIErrorType.AUTH,
                message: data.error || 'Authentication failed',
                statusCode,
            };
        }

        if (statusCode === 429) {
            return {
                type: APIErrorType.RATE_LIMIT,
                message: data.error || 'Rate limit exceeded',
                statusCode,
                retryAfter: parseInt(response.headers.get('Retry-After') || '60'),
            };
        }

        if (statusCode === 402 || data.error?.includes('credits')) {
            return {
                type: APIErrorType.CREDITS,
                message: data.error || 'Insufficient credits',
                statusCode,
            };
        }

        if (statusCode === 400 || statusCode === 422) {
            return {
                type: APIErrorType.VALIDATION,
                message: data.error || 'Validation failed',
                statusCode,
            };
        }

        if (statusCode >= 500) {
            return {
                type: APIErrorType.SERVER,
                message: data.error || 'Server error',
                statusCode,
            };
        }

        return {
            type: APIErrorType.UNKNOWN,
            message: data.error || `HTTP ${statusCode}`,
            statusCode,
        };
    }

    private shouldRetry(error: APIError, attemptNumber: number): boolean {
        if (attemptNumber >= MAX_RETRIES) return false;

        // Retry on network errors, timeouts, and 5xx errors
        return (
            error.type === APIErrorType.NETWORK ||
            error.type === APIErrorType.TIMEOUT ||
            error.type === APIErrorType.SERVER
        );
    }

    private inFlightRequests = new Map<string, Promise<APIResponse>>();

    public async request<T>(
        endpoint: string,
        options: RequestInit = {},
        attemptNumber: number = 0
    ): Promise<APIResponse<T>> {
        // Create a cache key based on endpoint and method (default GET)
        const method = options.method || 'GET';
        // Only dedupe GET requests to avoid side effects on mutations
        if (method === 'GET') {
            const cacheKey = `${method}:${endpoint}`;
            if (this.inFlightRequests.has(cacheKey)) {
                console.log(`[API] Deduping request to ${endpoint}`);
                return this.inFlightRequests.get(cacheKey) as Promise<APIResponse<T>>;
            }

            const requestPromise = this.performRequest<T>(endpoint, options, attemptNumber)
                .finally(() => {
                    // Remove from inflight map when done
                    this.inFlightRequests.delete(cacheKey);
                });

            this.inFlightRequests.set(cacheKey, requestPromise);
            return requestPromise;
        }

        return this.performRequest<T>(endpoint, options, attemptNumber);
    }

    private async performRequest<T>(
        endpoint: string,
        options: RequestInit = {},
        attemptNumber: number = 0
    ): Promise<APIResponse<T>> {
        // CRITICAL: Wait for token to be loaded from storage first
        await this.tokenLoadPromise;

        // Check network connectivity
        if (!this.isOnline) {
            console.warn('[API] Request attempted while offline:', endpoint);
            return {
                success: false,
                error: 'No network connection',
                errorType: APIErrorType.NETWORK,
            };
        }

        try {
            const headers: Record<string, string> = {
                ...(options.headers as Record<string, string> || {}),
            };

            // Only set Content-Type if not FormData (let browser handle FormData with boundary)
            if (!(options.body instanceof FormData) && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }

            // Always send Bearer token if available
            if (this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            }

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            const response = await fetch(getEndpointURL(endpoint), {
                ...options,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const responseData = await response.json();

            if (!response.ok) {
                const apiError = this.classifyError(response, responseData);

                // Detect Server Errors (5xx) -> API Down
                if (apiError.type === APIErrorType.SERVER) {
                    this.updateConnectionState('online', false);
                } else if (apiError.type !== APIErrorType.NETWORK && apiError.type !== APIErrorType.TIMEOUT) {
                    // 4xx errors mean API is reachable
                    this.updateConnectionState('online', true);
                }

                if (apiError.type === APIErrorType.AUTH) {
                    // DEBUG: Special handling for integrations endpoint
                    if (endpoint.includes('/integrations')) {
                        // Skip token clear for debugging
                    } else {
                        console.log('[API] Auth error detected on ' + endpoint + ', clearing token');
                        await this.clearAccessToken();
                    }
                    // Don't clear user/session here - let the auth service handle re-authentication
                }

                // Retry if applicable
                if (this.shouldRetry(apiError, attemptNumber)) {
                    const delay = RETRY_DELAYS[attemptNumber];
                    await this.delay(delay);
                    return this.request<T>(endpoint, options, attemptNumber + 1);
                }

                return {
                    success: false,
                    error: apiError.message,
                    errorType: apiError.type,
                };
            }

            // Unwrap the data field from API response { success: true, data: {...} }
            // Request Successful - Clear any offline/api-down state
            this.updateConnectionState('online', true);

            return {
                success: true,
                data: responseData.data as T,
            };
        } catch (error) {
            console.error('[API] Request exception:', endpoint, error);

            let apiError: APIError;

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    this.updateConnectionState('slow'); // Timeout implies slow/bad connection
                    apiError = {
                        type: APIErrorType.TIMEOUT,
                        message: 'Request timed out',
                    };
                } else if (error.message.includes('fetch') || error.message.includes('network')) {
                    apiError = {
                        type: APIErrorType.NETWORK,
                        message: 'Network error',
                    };
                } else {
                    apiError = {
                        type: APIErrorType.UNKNOWN,
                        message: error.message,
                    };
                }
            } else {
                apiError = {
                    type: APIErrorType.UNKNOWN,
                    message: 'Unknown error',
                };
            }

            // Retry if applicable
            if (this.shouldRetry(apiError, attemptNumber)) {
                const delay = RETRY_DELAYS[attemptNumber];
                await this.delay(delay);
                return this.request<T>(endpoint, options, attemptNumber + 1);
            }

            // General Network Error
            if (this.isOnline) {
                this.updateConnectionState('online', false);
            } else {
                this.updateConnectionState('offline');
            }
            return {
                success: false,
                error: apiError.message,
                errorType: apiError.type,
            };
        }
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        return AuthService.login(this, credentials);
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        return AuthService.register(this, data);
    }

    async logout(): Promise<void> {
        return AuthService.logout(this);
    }

    async validateSession(): Promise<{ valid: boolean; session?: Session }> {
        return AuthService.validateSession(this);
    }

    getBaseURL(): string {
        return API_CONFIG.baseURL;
    }

    // ============================================
    // USER & CREDITS
    // ============================================

    async getUser(): Promise<User | null> {
        return UserService.getUser(this);
    }

    async getCredits(): Promise<Credits | null> {
        return UserService.getCredits(this);
    }

    async getLimits(): Promise<PlanLimits | null> {
        return UserService.getLimits(this);
    }

    async getUsageStats(): Promise<UsageStats | null> {
        return UserService.getUsageStats(this);
    }

    async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
        return UserService.getSubscriptionStatus(this);
    }

    async getPlans(): Promise<any[] | null> {
        return UserService.getPlans(this);
    }

    async getTools(): Promise<any[] | null> {
        return ToolsService.getTools(this);
    }

    // ============================================
    // ANALYTICS & TRACKING
    // ============================================

    async trackEvent(event: AnalyticsEvent): Promise<void> {
        return AnalyticsService.trackEvent(this, event);
    }

    async trackToolRun(event: ToolRunEvent): Promise<void> {
        return AnalyticsService.trackToolRun(this, event);
    }

    // ============================================
    // INTEGRATIONS
    // ============================================

    async getIntegrations(): Promise<{ integrations: any[] } | null> {
        return IntegrationsService.getIntegrations(this);
    }

    async syncIntegration(id: string): Promise<boolean> {
        return IntegrationsService.syncIntegration(this, id);
    }

    async getAvailableIntegrations(): Promise<any[]> {
        return IntegrationsService.getAvailableIntegrations(this);
    }

    async connectIntegration(data: {
        definition_id: string;
        credentials?: any;
        settings?: any;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        return IntegrationsService.connectIntegration(this, data);
    }

    async disconnectIntegration(definitionId: string): Promise<boolean> {
        return IntegrationsService.disconnectIntegration(this, definitionId);
    }

    async configureNotificationChannel(data: {
        definition_id: string;
        config: any;
    }): Promise<{ success: boolean; data?: any; error?: string }> {
        return IntegrationsService.configureNotificationChannel(this, data);
    }

    async verifyIntegrationConnection(type: string, config: any): Promise<{ success: boolean; error?: string }> {
        return IntegrationsService.verifyConnection(this, { type, config });
    }

    // ============================================
    // FEATURES
    // ============================================

    async createExport(data: any): Promise<{ success: boolean; error?: string }> {
        return FeaturesService.createExport(this, data);
    }

    async checkPermission(data: {
        action: string;
        toolId: string;
        urlCount: number;
    }): Promise<{
        allowed: boolean;
        taskId?: string;
        creditsDeducted?: number;
        creditsRemaining?: number;
        reason?: string;
        code?: string;
        upgradeRequired?: string;
        upgradeUrl?: string;
        purchaseUrl?: string;
        resetsAt?: string;
        maxSchedules?: number;
        transactionId?: string;
    }> {
        return FeaturesService.checkPermission(this, data);
    }

    async getAvailableFeatures(): Promise<{
        plan: string;
        tools: any[];
        features: any;
    } | null> {
        return FeaturesService.getAvailableFeatures(this);
    }

    // ============================================
    // USER SETTINGS
    // ============================================

    async getUserSettings(forceRefresh = false): Promise<{ settings: any } | null> {
        return SettingsService.getUserSettings(this, forceRefresh);
    }

    // ============================================
    // SCHEDULED RUNS
    // ============================================

    async startScheduleRun(data: {
        scheduleId: string;
        toolId: string;
        marketplace: string;
        urlCount: number;
        triggeredBy: 'auto' | 'manual';
    }): Promise<{
        success: boolean;
        runId?: string;
        taskId?: string;
        creditsDeducted?: number;
        creditsRemaining?: number;
        transactionId?: string;
        error?: string;
        reason?: string;
    }> {
        return SchedulesService.startScheduleRun(this, data);
    }

    async completeScheduleRun(data: {
        runId: string;
        scheduleId: string;
        success: boolean;
        results?: any;
        errors?: string[];
        urlsProcessed: number;
        duration?: number;
    }): Promise<{ success: boolean; error?: string }> {
        return SchedulesService.completeScheduleRun(this, data);
    }

    async trackScheduleExecution(data: {
        scheduleId: string;
        toolId: string;
        marketplace: string;
        urlCount: number;
        triggeredBy: 'auto' | 'manual';
        success: boolean;
        duration?: number;
        creditsUsed: number;
    }): Promise<void> {
        return AnalyticsService.trackScheduleExecution(this, data);
    }

    // ============================================
    // USER PROFILE
    // ============================================

    async updateProfile(data: { fullName?: string; timezone?: string; email?: string }): Promise<any> {
        return UserService.updateProfile(this, data);
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
        return UserService.changePassword(this, currentPassword, newPassword);
    }

    // ============================================
    // BILLING
    // ============================================

    async post<T>(endpoint: string, body?: any): Promise<T> {
        return BillingService.post(this, endpoint, body);
    }

    // ============================================
    // TASKS (Refund System)
    // ============================================

    async startTask(data: StartTaskRequest): Promise<StartTaskResponse | null> {
        return TasksService.startTask(this, data);
    }

    async finalizeTask(taskId: string, data: FinalizeTaskRequest): Promise<FinalizeTaskResponse | null> {
        return TasksService.finalizeTask(this, taskId, data);
    }

    async getTask(taskId: string): Promise<TaskStatusResponse | null> {
        return TasksService.getTask(this, taskId);
    }

    async taskHeartbeat(taskId: string): Promise<void> {
        return TasksService.heartbeat(this, taskId);
    }
}

export const apiClient = new APIClient();

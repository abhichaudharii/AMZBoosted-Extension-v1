/**
 * API Configuration
 * 🔧 CHANGE API DOMAIN HERE - IT REFLECTS EVERYWHERE
 *
 * This is the SINGLE source of truth for API configuration.
 * Update the baseURL below to switch between environments.
 */

export const API_CONFIG = {
    /**
     * Base URL for all API requests
     *
     * To change environment, update VITE_API_URL in .env file:
     * - Development: http://localhost:8090/api/v1
     * - Staging: https://staging-api.amzboosted.com/api/v1
     * - Production: https://amzboosted.com/api/v1
     */
    baseURL: import.meta.env.VITE_API_URL || 'https://amzboosted.com/api/v1',

    /**
     * Dashboard URL for web links
     */
    dashboardURL: import.meta.env.VITE_DASHBOARD_URL || 'https://amzboosted.com',

    /**
     * Request timeout in milliseconds
     * Default: 30 seconds
     */
    timeout: 30000,

    /**
     * Maximum number of retry attempts for failed requests
     * Only retries on network errors, timeouts, and 5xx server errors
     * Set to 0 to disable retries
     */
    maxRetries: 0,

    /**
     * Retry delays in milliseconds (exponential backoff)
     * [1s, 2s, 4s]
     */
    retryDelays: [1000, 2000, 4000],

    /**
     * Rate limiting
     * Maximum requests per minute per user
     */
    maxRequestsPerMinute: 100,

    /**
     * API versioning
     */
    version: 'v1',
} as const;

/**
 * Get the full endpoint URL
 * @param path - API path (e.g., '/tasks' or 'tasks')
 * @returns Full URL (e.g., 'https://amzboosted.com/api/v1/tasks')
 */
export function getEndpointURL(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_CONFIG.baseURL}${normalizedPath}`;
}

/**
 * Check if currently using local development API
 */
export function isLocalAPI(): boolean {
    return API_CONFIG.baseURL.includes('localhost') || API_CONFIG.baseURL.includes('127.0.0.1');
}

/**
 * Check if currently using production API
 */
export function isProductionAPI(): boolean {
    return API_CONFIG.baseURL.includes('amzboosted.com') && !API_CONFIG.baseURL.includes('staging');
}

/**
 * Get current environment name
 */
export function getEnvironment(): 'development' | 'staging' | 'production' {
    if (isLocalAPI()) return 'development';
    if (isProductionAPI()) return 'production';
    return 'staging';
}

export default API_CONFIG;

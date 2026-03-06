/**
 * Authentication & User Types
 * All data synced with amzboosted.com backend
 */

export interface User {
    subscription: any;
    id: string;
    email: string;
    name: string;
    avatar?: string;
    plan: 'starter' | 'professional' | 'business' | 'enterprise';
    status: 'active' | 'trial' | 'expired' | 'suspended';
    createdAt: string;
    trialEndsAt?: string;
    full_name?: string;
    timezone?: string;
}

export interface Session {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: User;
    credits?: Credits;
}

export interface Credits {
    total: number;
    used: number;
    remaining: number;
    resetsAt?: string; // Monthly reset date
}

export interface PlanLimits {
    // Credit limits
    monthlyCredits: number;

    // Feature limits
    maxIntegrations: number;
    maxSchedules: number;
    maxExportsPerMonth: number;
    maxWebhooks: number;
    maxApiKeys: number;
    maxMarketplaces: number;
    maxAccounts: number;
    allowedFrequencies: string[];

    // Tool-specific limits
    maxUrlsPerRun: number;
    maxConcurrentRuns: number;

    // Storage
    dataRetentionDays: number;
    maxStorageMB: number;

    // Support
    supportTier: 'community' | 'email' | 'priority' | 'dedicated';

    // Advanced features
    features: {
        advancedAnalytics: boolean;
        customWebhooks: boolean;
        apiAccess: boolean;
        whiteLabel: boolean;
        teamMembers: number;
        customIntegrations: boolean;
    };
}

// Simplified Plan Structure from Usage Endpoint
export interface PlanStatus {
    id: string;
    name: string;
    status: 'active' | 'trial' | 'expired' | 'suspended';
    trialEndsAt?: string;
    periodEndsAt?: string;
}

export interface UsageStats {
    // New simplified usage structure
    integrations: {
        connected: number;
    };
    webhooks: {
        total: number;
    };
}

export interface AuthResponse {
    success: boolean;
    session?: Session;
    error?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

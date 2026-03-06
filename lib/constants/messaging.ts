/**
 * Shared Messaging Constants
 * Single source of truth for all user-facing messages
 */

export const BRAND = {
    name: 'AMZBoosted',
    tagline: 'Advanced Amazon Seller Tools Suite',
    description: 'Powerful tools to analyze, optimize, and grow your Amazon business',
} as const;

export const TRIAL = {
    duration: 14, // days
    description: '14-day free trial',
    fullDescription: 'Start your 14-day free trial - no credit card required',
} as const;

export const STATS = {
    activeUsers: '2,500+',
    totalExtractions: '1M+',
    averageRating: 4.9,
    countriesSupported: 8,
} as const;

export const SUPPORT = {
    email: 'support@amzboosted.com',
    docsUrl: 'https://docs.amzboosted.com',
    statusUrl: 'https://status.amzboosted.com',
} as const;

export const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'forever',
        description: 'Perfect for getting started',
        limits: {
            credits: 100,
            runsPerMonth: 10,
            bulkUrls: 5,
            schedules: 0,
            reports: 5,
        },
    },
    starter: {
        id: 'starter',
        name: 'Starter',
        price: 19,
        interval: 'month',
        description: 'For small businesses',
        limits: {
            credits: 1000,
            runsPerMonth: 100,
            bulkUrls: 25,
            schedules: 5,
            reports: 25,
        },
    },
    pro: {
        id: 'pro',
        name: 'Professional',
        price: 49,
        interval: 'month',
        description: 'For growing businesses',
        popular: true,
        limits: {
            credits: 5000,
            runsPerMonth: 500,
            bulkUrls: 100,
            schedules: 10,
            reports: 100,
        },
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        interval: 'month',
        description: 'For large operations',
        limits: {
            credits: Infinity,
            runsPerMonth: Infinity,
            bulkUrls: Infinity,
            schedules: Infinity,
            reports: Infinity,
        },
    },
} as const;

export const FEATURES = {
    asinExtractor: {
        name: 'ASIN Extractor',
        description: 'Extract product ASINs from any Amazon page',
        icon: 'Package',
    },
    reviewAnalyzer: {
        name: 'Review Analyzer',
        description: 'Analyze customer reviews and sentiment',
        icon: 'MessageSquare',
    },
    priceTracker: {
        name: 'Price Tracker',
        description: 'Monitor product prices over time',
        icon: 'TrendingUp',
    },
    keywordInsights: {
        name: 'Keyword Insights',
        description: 'Discover profitable keywords',
        icon: 'Search',
    },
    listingAnalyzer: {
        name: 'Listing Analyzer',
        description: 'Optimize your product listings',
        icon: 'FileText',
    },
    competitorMonitor: {
        name: 'Competitor Monitor',
        description: 'Track competitor products and strategies',
        icon: 'Eye',
    },
    inventoryAlerts: {
        name: 'Inventory Alerts',
        description: 'Get notified about stock changes',
        icon: 'Bell',
    },
    bulkOperations: {
        name: 'Bulk Operations',
        description: 'Process multiple products at once',
        icon: 'Layers',
    },
} as const;

export const ERROR_MESSAGES = {
    network: 'Network error. Please check your connection and try again.',
    auth: 'Authentication failed. Please log in again.',
    rateLimit: 'Too many requests. Please wait a moment and try again.',
    credits: 'Insufficient credits. Please upgrade your plan.',
    notFound: 'Resource not found.',
    validation: 'Invalid input. Please check your data and try again.',
    server: 'Server error. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    sessionRevoked: 'Session revoked successfully',
    allSessionsRevoked: 'All other sessions revoked',
    avatarUploaded: 'Avatar uploaded successfully',
    avatarRemoved: 'Avatar removed successfully',
    preferencesSaved: 'Preferences saved successfully',
    integrationConnected: 'Integration connected successfully',
    integrationDisconnected: 'Integration disconnected successfully',
    webhookCreated: 'Webhook created successfully',
    webhookDeleted: 'Webhook deleted successfully',
    apiKeyCreated: 'API key created successfully',
    apiKeyDeleted: 'API key deleted successfully',
    twoFactorEnabled: '2FA enabled successfully',
    twoFactorDisabled: '2FA disabled successfully',
} as const;

export const VALIDATION = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
    },
    password: {
        minLength: 8,
        message: 'Password must be at least 8 characters long',
    },
    url: {
        pattern: /^https?:\/\/.+/,
        message: 'Please enter a valid URL starting with http:// or https://',
    },
    apiKey: {
        pattern: /^amz_[a-f0-9]{64}$/,
        message: 'Invalid API key format',
    },
} as const;

export const LIMITS = {
    avatar: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        message: 'Avatar must be less than 5MB and in JPEG, PNG, WebP, or GIF format',
    },
    bulkUrls: {
        max: 1000,
        message: 'Maximum 1000 URLs per bulk operation',
    },
    webhookEvents: {
        max: 10,
        message: 'Maximum 10 events per webhook',
    },
} as const;

export const TIMEZONES = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
] as const;

export const EXPORT_FORMATS = [
    { value: 'csv', label: 'CSV', extension: '.csv' },
    { value: 'json', label: 'JSON', extension: '.json' },
    { value: 'xlsx', label: 'Excel (XLSX)', extension: '.xlsx' },
] as const;

export const WEBHOOK_EVENTS = [
    { value: 'task.started', label: 'Task Started' },
    { value: 'task.completed', label: 'Task Completed' },
    { value: 'task.failed', label: 'Task Failed' },
    { value: 'export.ready', label: 'Export Ready' },
    { value: 'report.generated', label: 'Report Generated' },
    { value: 'alert.triggered', label: 'Alert Triggered' },
    { value: 'credit.low', label: 'Credits Running Low' },
    { value: 'credit.depleted', label: 'Credits Depleted' },
] as const;

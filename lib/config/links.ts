/**
 * AMZBoosted Extension — Single Source of Truth for External Links
 *
 * Update this file when any external URL changes.
 * All components should import from here — never hardcode URLs inline.
 *
 * In WXT/Vite extensions, public env vars are exposed via import.meta.env.
 */

export const LINKS = {
    // Community
    discord: import.meta.env.VITE_DISCORD_URL || '#',
    telegram: import.meta.env.VITE_TELEGRAM_URL || '#',

    // Social
    twitter: import.meta.env.VITE_TWITTER_URL || '#',
    linkedin: import.meta.env.VITE_LINKEDIN_URL || '#',

    // Product
    chromeStore: import.meta.env.VITE_CHROME_STORE_URL || '#',
    website: import.meta.env.VITE_APP_URL || 'https://amzboosted.com',

    // Support
    supportEmail: 'support@amzboosted.com',
    helpCenter: 'https://amzboosted.com/help',
    status: 'https://amzboosted.com/status',
    community: 'https://amzboosted.com/community',
    changelog: 'https://amzboosted.com/changelog',
} as const;

export type LinkKey = keyof typeof LINKS;

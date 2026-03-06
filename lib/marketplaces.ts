import { FlagKey } from './flags';

export interface Marketplace {
    id: string;
    name: string;
    flagKey: FlagKey;
    domain: string;
}

export const marketplaces: Marketplace[] = [
    { id: 'US', name: 'United States', flagKey: 'us', domain: 'amazon.com' },
    { id: 'UK', name: 'United Kingdom', flagKey: 'uk', domain: 'amazon.co.uk' },
    { id: 'CA', name: 'Canada', flagKey: 'ca', domain: 'amazon.ca' },
    { id: 'IN', name: 'India', flagKey: 'in', domain: 'amazon.in' },
    { id: 'DE', name: 'Germany', flagKey: 'de', domain: 'amazon.de' },
    { id: 'FR', name: 'France', flagKey: 'fr', domain: 'amazon.fr' },
    { id: 'IT', name: 'Italy', flagKey: 'it', domain: 'amazon.it' },
    { id: 'ES', name: 'Spain', flagKey: 'es', domain: 'amazon.es' },
];

export const getMarketplaceById = (id: string): Marketplace | undefined => {
    return marketplaces.find((m) => m.id.toLowerCase() === id.toLowerCase());
};

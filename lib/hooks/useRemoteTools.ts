import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type { Tool } from '@/entrypoints/sidepanel/lib/tools';
import { getIconByName } from '@/lib/utils/icon-map';
import { secureStorage } from '@/lib/storage/secure-storage';
import { getToolDefinition } from '@/lib/tool-definitions';

export function useRemoteTools() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTools();
    }, []);

    const loadTools = async () => {
        try {
            setLoading(true);

            // 1. Try to get from cache first for immediate display
            // 1. Try to get from cache first for immediate display
            // We use 'raw_tool_config' which stores the raw API response and allows us to re-process 
            // it with the latest logic (like category renaming).
            // Legacy 'cached_tools' is ignored to prevent stale data/icons issues.

            const rawCache = await secureStorage.get('raw_tool_config');
            if (rawCache.raw_tool_config && Array.isArray(rawCache.raw_tool_config)) {
                setTools(processTools(rawCache.raw_tool_config));
            }

            // 2. Fetch fresh from API
            const remoteConfigs = await apiClient.getTools();

            if (remoteConfigs && Array.isArray(remoteConfigs)) {
                const processed = processTools(remoteConfigs);
                setTools(processed);

                // 3. Cache the fresh RAW config
                await secureStorage.set({ raw_tool_config: remoteConfigs });
            }
        } catch (error) {
            console.error('Failed to load remote tools config:', error);
        } finally {
            setLoading(false);
        }
    };

    const toTitleCase = (str: string) => {
        return str.replace(
            /\w\S*/g,
            text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
        );
    };

    const processTools = (configs: any[]): Tool[] => {


        const processed = configs.map((remote: any) => {
            let category = remote.category || 'General';

            // 1. Normalize Category: Replace underscores with spaces and Title Case
            // "performance_reports" -> "Performance Reports"
            // "business_reports" -> "Business Reports"
            category = category.replace(/_/g, ' ');
            category = toTitleCase(category);

            // 2. Dynamic Theme Assignment based on Category
            // Ignore remote metadata to enforce our new design system
            let colorTheme = undefined; // remote.metadata?.colorTheme;

            if (!colorTheme) {
                switch (category) {
                    case 'Performance Reports':
                    case 'Business Reports':
                        colorTheme = 'violet';
                        break;
                    case 'Inventory Management':
                        colorTheme = 'emerald';
                        break;
                    case 'Product Research':
                        colorTheme = 'blue';
                        break;
                    case 'Listing Optimization':
                        colorTheme = 'purple';
                        break;
                    case 'Competitor Analysis':
                    case 'Customer Intelligence':
                    case 'Support':
                        colorTheme = 'rose';
                        break;
                    case 'Ppc & Advertising': // TitleCase behavior on "PPC"
                    case 'PPC & Advertising':
                        colorTheme = 'amber';
                        break;
                    default:
                        // Fallback to blue or slate if unknown
                        colorTheme = 'blue';
                }
            }

            // 3. Merge Local Configuration (Validation, Export Settings)
            const localDef = getToolDefinition(remote.id, remote.name);

            return {
                id: remote.id,
                name: remote.name,
                description: remote.description || '',
                category: category,
                icon: getIconByName(remote.metadata?.icon),
                ctaLabel: 'Quick Use',
                path: `/tools/${remote.id}`,
                colorTheme: colorTheme as any,
                enabled: remote.enabled !== false,
                accessLevel: remote.accessLevel,
                // Preserve icon name for potential debugging
                iconName: remote.metadata?.icon,
                comingSoon: remote.metadata?.comingSoon || false,
                inputConfig: getInputConfigForTool(remote.id),
                validation: localDef?.validation,
                exportParams: localDef?.exportParams
            };
        });

        return processed;
    };

    const getInputConfigForTool = (toolId: string) => {
        if (toolId === 'category-insights') {
            return {
                inputs: [
                    {
                        key: 'keywords',
                        label: 'Keywords',
                        type: 'textarea' as const,
                        placeholder: 'Enter keywords, one per line',
                        required: true,
                        description: 'Enter the keywords you want to analyze.'
                    }
                ]
            };
        }
        if (toolId === 'top-terms') {
            return {
                inputs: [
                    {
                        key: 'search_term',
                        label: 'Search Term',
                        type: 'text' as const,
                        placeholder: 'e.g. "running shoes"',
                        required: false
                    },
                    {
                        key: 'asins',
                        label: 'ASINs',
                        type: 'textarea' as const,
                        placeholder: 'Enter ASINs, one per line',
                        required: false,
                        description: 'Enter the ASINs to track rankings for.'
                    }
                ]
            };
        }
        // Default Config (fallback for tools that just need URLs/ASINs)
        return {
            inputs: [
                {
                    key: 'urls',
                    label: 'URLs / ASINs',
                    type: 'textarea' as const,
                    placeholder: 'Enter URLs or ASINs, one per line',
                    required: true
                }
            ]
        };
    };

    return { tools, loading, refresh: loadTools };
}

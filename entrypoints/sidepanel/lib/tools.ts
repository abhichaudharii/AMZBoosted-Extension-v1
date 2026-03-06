export type ToolTheme = 'violet' | 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide icon component
    ctaLabel: string;
    enabled?: boolean;
    accessLevel?: string;
    path?: string;
    category: string; // e.g. "Analytics", "Advertising"
    colorTheme: ToolTheme;
    iconName?: string; // Optional: name of the icon string from API
    comingSoon?: boolean;
    inputConfig?: {
        inputs: {
            key: string;
            label: string;
            type: 'text' | 'textarea' | 'number';
            placeholder?: string;
            required?: boolean;
            description?: string;
        }[];
    };
    /**
     * Configuration for Input Validation & UI
     */
    validation?: {
        type: 'asinList' | 'urlList' | 'keywordList' | 'mixed' | 'none';
        requireInput?: boolean;
        message?: string;
    };
    /**
     * Configuration for Export Settings
     */
    exportParams?: {
        supportsExportSettings?: boolean;
        stateBinding?: 'asin' | 'category' | 'salesTraffic' | 'sqp';
    };
}

// Deprecated: Tools are now loaded dynamically from API via useRemoteTools hook.
// This array is kept empty or removed to prevent usage.
export const tools: Tool[] = [];
import * as LucideIcons from 'lucide-react';

/**
 * Dynamically retrieve a Lucide icon component by its string name.
 * 
 * @param name The name of the icon (e.g., 'Zap', 'BarChart3')
 * @returns The Lucide Icon component, or a default fallback if not found.
 */
export const getIconByName = (name: string | undefined | null) => {
    if (!name) return LucideIcons.HelpCircle;

    // Direct lookup in the imported namespace
    // This assumes the name matches the export name exactly (e.g. "Zap")
    const Icon = (LucideIcons as any)[name];

    if (Icon) {
        return Icon;
    }

    // Fallback icon
    console.warn(`[IconMap] Icon not found: ${name}`);
    return LucideIcons.HelpCircle;
};

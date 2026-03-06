/**
 * useTheme Hook
 * Manages dark/light theme
 */

import { useState, useEffect } from 'react';
import { secureStorage } from '@/lib/storage/secure-storage';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Load saved theme
        loadTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme(mediaQuery.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [theme]);

    const loadTheme = async () => {
        try {
            const result = await secureStorage.get('theme');
            const savedTheme = (result.theme || 'system') as Theme;
            setThemeState(savedTheme);

            if (savedTheme === 'system') {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(isDark ? 'dark' : 'light');
            } else {
                applyTheme(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const applyTheme = (resolvedTheme: 'light' | 'dark') => {
        setResolvedTheme(resolvedTheme);

        if (resolvedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        await secureStorage.set({ theme: newTheme });

        if (newTheme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(isDark ? 'dark' : 'light');
        } else {
            applyTheme(newTheme);
        }
    };

    return {
        theme,
        resolvedTheme,
        setTheme,
    };
}

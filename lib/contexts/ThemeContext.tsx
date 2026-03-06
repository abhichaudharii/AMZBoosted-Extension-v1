import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1. Initialize with localStorage for immediate render (prevent flash)
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme');
        return (stored as Theme) || 'system';
    }
    return 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // 2. Sync with Chrome Storage (Cross-Window Sync)
  useEffect(() => {
      // Load from Chrome Storage on mount (authoritative source)
      chrome.storage.local.get('theme').then((result) => {
          if (result.theme) {
              setThemeState(result.theme as Theme);
          }
      });

      // Listen for changes from other windows/sidepanels
      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
          if (changes.theme) {
              const newTheme = changes.theme.newValue as Theme;
              setThemeState(newTheme);
              // Also update local storage to keep them in sync
              localStorage.setItem('theme', newTheme);
          }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = () => {
      const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
      setActualTheme(resolvedTheme);
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    // Propagate to other windows via Chrome Storage
    chrome.storage.local.set({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

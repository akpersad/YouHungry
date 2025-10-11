'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'you-hungry-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  // Resolve theme based on current setting
  const resolveTheme = useCallback((currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  }, []);

  // Set theme and update DOM
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }

    // Update resolved theme
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);

    // Update DOM classes and CSS custom properties
    updateDOMTheme(resolved);
  };

  // Update DOM with theme
  const updateDOMTheme = (resolved: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add new theme class
    root.classList.add(resolved);

    // Update CSS custom properties for manual theme override
    if (resolved === 'dark') {
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#1a1a1a');
      root.style.setProperty('--bg-tertiary', '#2d2d2d');
      root.style.setProperty('--bg-quaternary', '#404040');
      root.style.setProperty('--bg-quinary', '#ababab');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#d1d1d1');
      root.style.setProperty('--text-tertiary', '#b8b8b8');
      root.style.setProperty('--text-inverse', '#1a1a1a');
      root.style.setProperty('--shadow-subtle', '0 2px 8px rgba(0, 0, 0, 0.4)');
      root.style.setProperty(
        '--shadow-medium',
        '0 4px 16px rgba(0, 0, 0, 0.5)'
      );
      root.style.setProperty(
        '--shadow-strong',
        '0 8px 32px rgba(0, 0, 0, 0.6)'
      );
      root.style.setProperty(
        '--shadow-inset',
        'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
      );
      root.style.setProperty(
        '--shadow-layered',
        '0 2px 8px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5)'
      );
      root.style.setProperty(
        '--shadow-glow',
        '0 0 20px rgba(255, 51, 102, 0.25)'
      );
      root.style.setProperty(
        '--shadow-neumorphic-dark',
        'inset 2px 2px 4px rgba(255, 255, 255, 0.05), inset -2px -2px 4px rgba(0, 0, 0, 0.4)'
      );
      root.style.setProperty(
        '--shadow-neumorphic-elevated',
        '4px 4px 12px rgba(0, 0, 0, 0.4), -4px -4px 12px rgba(255, 255, 255, 0.05)'
      );
      root.style.setProperty(
        '--shadow-neumorphic-pressed',
        'inset 4px 4px 8px rgba(0, 0, 0, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.05)'
      );
    } else {
      root.style.setProperty('--bg-primary', '#fafafa');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#f5f5f5');
      root.style.setProperty('--bg-quaternary', '#e5e5e5');
      root.style.setProperty('--bg-quinary', '#d1d1d1');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#4a4a4a');
      root.style.setProperty('--text-tertiary', '#6b6b6b');
      root.style.setProperty('--text-inverse', '#ffffff');
      root.style.setProperty(
        '--shadow-subtle',
        '0 2px 8px rgba(0, 0, 0, 0.08)'
      );
      root.style.setProperty(
        '--shadow-medium',
        '0 4px 16px rgba(0, 0, 0, 0.12)'
      );
      root.style.setProperty(
        '--shadow-strong',
        '0 8px 32px rgba(0, 0, 0, 0.16)'
      );
      root.style.setProperty(
        '--shadow-inset',
        'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
      );
      root.style.setProperty(
        '--shadow-layered',
        '0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.12)'
      );
      root.style.setProperty(
        '--shadow-glow',
        '0 0 20px rgba(255, 51, 102, 0.15)'
      );
      root.style.setProperty(
        '--shadow-neumorphic-light',
        'inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(0, 0, 0, 0.08)'
      );
      root.style.setProperty(
        '--shadow-neumorphic-elevated',
        '4px 4px 12px rgba(0, 0, 0, 0.08), -4px -4px 12px rgba(255, 255, 255, 0.9)'
      );
      root.style.setProperty(
        '--shadow-neumorphic-pressed',
        'inset 4px 4px 8px rgba(0, 0, 0, 0.08), inset -4px -4px 8px rgba(255, 255, 255, 0.9)'
      );
    }
  };

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    const current = resolvedTheme;
    const newTheme = current === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    // Load from localStorage
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    const initialTheme = (stored as Theme) || defaultTheme;

    setThemeState(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        const resolved = resolveTheme('system');
        setResolvedTheme(resolved);
        updateDOMTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Set initial resolved theme and update DOM
    const resolved = resolveTheme(initialTheme);
    setResolvedTheme(resolved);
    updateDOMTheme(resolved);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [storageKey, defaultTheme, resolveTheme, theme]);

  // Update resolved theme when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
  }, [theme, resolveTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

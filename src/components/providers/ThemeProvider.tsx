'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
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

// Get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getServerSystemTheme = (): 'light' | 'dark' => 'light';

// Listen for system theme changes
const subscribeToSystemTheme = (callback: () => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

// localStorage is only read once after hydration (it is not an event source
// we subscribe to), so the subscribe function is a no-op
const subscribeToLocalStorage = () => () => {};
const getServerStoredTheme = () => null;

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
    root.style.setProperty('--shadow-medium', '0 4px 16px rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--shadow-strong', '0 8px 32px rgba(0, 0, 0, 0.6)');
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
    root.style.setProperty('--shadow-subtle', '0 2px 8px rgba(0, 0, 0, 0.08)');
    root.style.setProperty('--shadow-medium', '0 4px 16px rgba(0, 0, 0, 0.12)');
    root.style.setProperty('--shadow-strong', '0 8px 32px rgba(0, 0, 0, 0.16)');
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

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'forkintheroad-theme',
}: ThemeProviderProps) {
  // Theme persisted in localStorage. Read via useSyncExternalStore so the
  // server/hydration render uses the default theme and the stored theme is
  // applied right after hydration (same two-phase behavior as before, but
  // without calling setState synchronously in an effect).
  const getStoredTheme = useCallback(
    () => localStorage.getItem(storageKey),
    [storageKey]
  );
  const storedTheme = useSyncExternalStore(
    subscribeToLocalStorage,
    getStoredTheme,
    getServerStoredTheme
  );

  // System color-scheme preference, kept in sync via subscription
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerSystemTheme
  );

  // Theme explicitly chosen during this session (takes precedence over the
  // value read from localStorage at mount)
  const [sessionTheme, setSessionTheme] = useState<Theme | null>(null);

  const theme: Theme = sessionTheme || (storedTheme as Theme) || defaultTheme;

  // Resolve theme based on current setting (derived during render)
  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? systemTheme : theme;

  // Set theme and update DOM
  const setTheme = (newTheme: Theme) => {
    setSessionTheme(newTheme);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }

    // Update DOM classes and CSS custom properties immediately
    updateDOMTheme(newTheme === 'system' ? getSystemTheme() : newTheme);
  };

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    const current = resolvedTheme;
    const newTheme = current === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Keep DOM classes and CSS custom properties in sync with the resolved
  // theme (initial mount, stored theme applied after hydration, and system
  // preference changes)
  useEffect(() => {
    updateDOMTheme(resolvedTheme);
  }, [resolvedTheme]);

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

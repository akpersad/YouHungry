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

// Update DOM with theme. All token values live in globals.css under the
// .light/.dark classes — this only switches the class (the pre-hydration
// script in layout.tsx does the same before first paint).
const updateDOMTheme = (resolved: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
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

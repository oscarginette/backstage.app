'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Theme, ThemeMode, THEMES, THEME_MODES, THEME_STORAGE } from '@/domain/types/appearance';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ThemeMode;
  setTheme: (theme: Theme) => void;
  systemTheme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * ThemeProvider
 *
 * Client-side theme management with:
 * - Multi-layer persistence (cookie + localStorage)
 * - SSR-compatible (no hydration flicker)
 * - System theme detection
 * - React Context for global access
 *
 * Pattern: Mirrors I18nProvider from lib/i18n/context.tsx
 *
 * USAGE:
 * ```tsx
 * // In layout.tsx
 * <ThemeProvider defaultTheme="system">
 *   {children}
 * </ThemeProvider>
 *
 * // In any component
 * const { theme, resolvedTheme, setTheme } = useTheme();
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = THEMES.SYSTEM,
  storageKey = THEME_STORAGE.LOCAL_STORAGE_KEY,
}: ThemeProviderProps) {
  // State
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(THEME_MODES.LIGHT);
  const [mounted, setMounted] = useState(false);

  // Resolved theme (what actually renders)
  const resolvedTheme: ThemeMode =
    theme === THEMES.SYSTEM ? systemTheme : (theme as ThemeMode);

  /**
   * Get theme from cookie (SSR-safe)
   * Priority: Cookie > LocalStorage > Default
   */
  const getInitialTheme = useCallback((): Theme => {
    // Try cookie first (for SSR consistency)
    const cookieTheme = getCookie(THEME_STORAGE.COOKIE_NAME);
    if (cookieTheme && Object.values(THEMES).includes(cookieTheme as Theme)) {
      return cookieTheme as Theme;
    }

    // Try localStorage (client-side fallback)
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme && Object.values(THEMES).includes(storedTheme as Theme)) {
        return storedTheme as Theme;
      }
    }

    return defaultTheme;
  }, [defaultTheme, storageKey]);

  /**
   * Detect system theme preference
   */
  const detectSystemTheme = useCallback((): ThemeMode => {
    if (typeof window === 'undefined') return THEME_MODES.LIGHT;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;
  }, []);

  /**
   * Update theme (persist to cookie + localStorage + DOM)
   */
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);

      // Persist to cookie (365 days)
      setCookie(THEME_STORAGE.COOKIE_NAME, newTheme, THEME_STORAGE.COOKIE_EXPIRY_DAYS);

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }

      // Update DOM immediately (for CSS)
      updateDOMTheme(newTheme === THEMES.SYSTEM ? systemTheme : (newTheme as ThemeMode));
    },
    [storageKey, systemTheme]
  );

  /**
   * Update DOM class for CSS
   */
  const updateDOMTheme = useCallback((mode: ThemeMode) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);
    root.classList.add(mode);
    root.setAttribute('data-theme', mode);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    const detectedSystemTheme = detectSystemTheme();

    setThemeState(initialTheme);
    setSystemTheme(detectedSystemTheme);
    setMounted(true);

    // Apply theme to DOM
    const effectiveTheme =
      initialTheme === THEMES.SYSTEM ? detectedSystemTheme : (initialTheme as ThemeMode);
    updateDOMTheme(effectiveTheme);
  }, [getInitialTheme, detectSystemTheme, updateDOMTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      setSystemTheme(newSystemTheme);

      // If using system theme, update DOM
      if (theme === THEMES.SYSTEM) {
        updateDOMTheme(newSystemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, updateDOMTheme]);

  // Prevent flicker: don't render until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 *
 * Access theme context from any component.
 *
 * USAGE:
 * ```tsx
 * const { theme, resolvedTheme, setTheme } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * Cookie utilities (mirrors I18nProvider pattern)
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

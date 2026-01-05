'use client';

import { useTheme } from '@/infrastructure/theme/ThemeProvider';
import { THEMES, Theme } from '@/domain/types/appearance';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * ThemeSwitcher Component
 *
 * UI component for switching themes.
 * Updates both client-side (cookie/localStorage) and server-side (database).
 *
 * Clean Architecture:
 * - Presentation layer (UI only)
 * - Single responsibility (SRP)
 * - Uses ThemeProvider context for state management
 *
 * USAGE:
 * ```tsx
 * <ThemeSwitcher />
 * ```
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = async (newTheme: Theme) => {
    // Update client-side immediately (optimistic UI)
    setTheme(newTheme);

    // Persist to database (fire-and-forget)
    try {
      await fetch('/api/user/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Note: Client-side theme still works (cookie/localStorage)
    }
  };

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: THEMES.LIGHT, label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: THEMES.DARK, label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: THEMES.SYSTEM, label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Appearance</label>
      <div className="flex gap-2">
        {themes.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
              ${
                theme === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-card-foreground border-border hover:bg-muted'
              }
            `}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={theme === value}
          >
            {icon}
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Choose your preferred color scheme
      </p>
    </div>
  );
}

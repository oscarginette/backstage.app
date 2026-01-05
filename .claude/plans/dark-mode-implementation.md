# Dark Mode Implementation Plan - Clean Architecture + SOLID

**Project**: Backstage Platform
**Date**: 2026-01-05
**Architecture**: Clean Architecture + SOLID Principles + Typed Constants

---

## 📋 Executive Summary

This plan implements a production-grade dark mode system following Clean Architecture, SOLID principles, and the project's established patterns. The implementation prioritizes:

1. **Robustness**: Multi-layer persistence (cookie + database), SSR-compatible, flicker-free
2. **Correctness**: Type-safe, follows existing architectural patterns (mirrors i18n implementation)
3. **Maintainability**: Single Responsibility per component, easy to extend with new themes
4. **SOLID Compliance**: Dependency Inversion, Interface Segregation, Open/Closed principle

---

## 🎯 Architecture Overview

### Layer Structure

```
domain/                          # Business Logic (Zero Dependencies)
├── entities/
│   └── UserAppearance.ts        # Theme preference entity with validation
├── repositories/
│   └── IUserAppearanceRepository.ts  # Interface only (DIP)
├── services/
│   ├── GetUserAppearanceUseCase.ts   # Read theme preference
│   └── UpdateUserAppearanceUseCase.ts # Update theme preference
└── types/
    └── appearance.ts            # Typed constants (Theme, ThemeMode, etc.)

infrastructure/                  # External Dependencies
├── database/
│   └── repositories/
│       └── PostgresUserAppearanceRepository.ts  # DB implementation
└── theme/
    └── ThemeProvider.tsx        # React Context (client-side persistence)

app/                            # Presentation Layer
├── layout.tsx                  # Root layout (add ThemeProvider)
├── settings/
│   └── SettingsClient.tsx      # Theme switcher UI component
└── api/
    └── user/
        └── appearance/
            └── route.ts         # API endpoint (orchestration only)
```

---

## 🏗️ Implementation Plan

### Phase 1: Domain Layer (Business Logic)

**Objective**: Define theme entities, interfaces, and use cases with zero external dependencies.

#### 1.1 Create Typed Constants (`domain/types/appearance.ts`)

```typescript
/**
 * Theme type definition
 *
 * Follows pattern from subscriptions.ts and user-roles.ts
 */
export type Theme = 'light' | 'dark' | 'system';

export const THEMES = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
  SYSTEM: 'system' as const,
} as const;

/**
 * Resolved theme mode (what actually renders)
 */
export type ThemeMode = 'light' | 'dark';

export const THEME_MODES = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
} as const;

/**
 * Storage keys
 */
export const THEME_STORAGE = {
  COOKIE_NAME: 'BACKSTAGE_THEME',
  COOKIE_EXPIRY_DAYS: 365,
  LOCAL_STORAGE_KEY: 'theme',
} as const;
```

**Why**:
- ✅ Type safety: No magic strings (`'dark'` → `THEMES.DARK`)
- ✅ Single source of truth
- ✅ Follows project pattern (see `subscriptions.ts`)

---

#### 1.2 Create UserAppearance Entity (`domain/entities/UserAppearance.ts`)

```typescript
import { THEMES, Theme } from '@/domain/types/appearance';

export interface UserAppearanceProps {
  userId: number;
  theme: Theme;
  updatedAt: Date;
}

/**
 * UserAppearance Entity
 *
 * Represents user's appearance preferences (theme mode).
 * Immutable entity with validation.
 *
 * Business Rules:
 * - Theme must be one of: light, dark, system
 * - UserId must be positive integer
 * - Default theme is 'system' (respects OS preference)
 */
export class UserAppearance {
  private constructor(
    public readonly userId: number,
    public readonly theme: Theme,
    public readonly updatedAt: Date
  ) {}

  static create(props: UserAppearanceProps): UserAppearance {
    UserAppearance.validate(props);
    return new UserAppearance(props.userId, props.theme, props.updatedAt);
  }

  static createDefault(userId: number): UserAppearance {
    return new UserAppearance(userId, THEMES.SYSTEM, new Date());
  }

  private static validate(props: UserAppearanceProps): void {
    if (!Number.isInteger(props.userId) || props.userId <= 0) {
      throw new Error('UserId must be a positive integer');
    }

    const validThemes = Object.values(THEMES);
    if (!validThemes.includes(props.theme)) {
      throw new Error(
        `Invalid theme: ${props.theme}. Must be one of: ${validThemes.join(', ')}`
      );
    }
  }

  /**
   * Update theme preference
   * Returns new instance (immutability)
   */
  updateTheme(newTheme: Theme): UserAppearance {
    return UserAppearance.create({
      userId: this.userId,
      theme: newTheme,
      updatedAt: new Date(),
    });
  }

  toJSON() {
    return {
      userId: this.userId,
      theme: this.theme,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
```

**Why**:
- ✅ SRP: Only handles theme preference logic
- ✅ Immutability: `updateTheme()` returns new instance
- ✅ Validation: Ensures data integrity
- ✅ Zero dependencies: Pure business logic

---

#### 1.3 Create Repository Interface (`domain/repositories/IUserAppearanceRepository.ts`)

```typescript
import { UserAppearance } from '@/domain/entities/UserAppearance';
import { Theme } from '@/domain/types/appearance';

/**
 * IUserAppearanceRepository
 *
 * Persistence interface for user appearance preferences.
 * Follows Interface Segregation Principle (ISP).
 *
 * Implementations:
 * - PostgresUserAppearanceRepository (database)
 * - MockUserAppearanceRepository (testing)
 */
export interface IUserAppearanceRepository {
  /**
   * Get user's appearance preferences
   * Returns default (system theme) if not found
   */
  getByUserId(userId: number): Promise<UserAppearance>;

  /**
   * Update user's theme preference
   * Creates record if not exists (upsert)
   */
  updateTheme(userId: number, theme: Theme): Promise<UserAppearance>;

  /**
   * Check if user has custom appearance settings
   */
  exists(userId: number): Promise<boolean>;
}
```

**Why**:
- ✅ DIP: Domain depends on interface, not implementation
- ✅ ISP: Minimal interface (only needed methods)
- ✅ Easy testing: Mock implementation for tests

---

#### 1.4 Create Use Cases

**GetUserAppearanceUseCase** (`domain/services/GetUserAppearanceUseCase.ts`):

```typescript
import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';

/**
 * GetUserAppearanceUseCase
 *
 * Retrieves user's appearance preferences.
 * Returns default (system theme) if no preference stored.
 *
 * Clean Architecture: Use Case orchestrates business logic.
 */
export class GetUserAppearanceUseCase {
  constructor(
    private readonly appearanceRepository: IUserAppearanceRepository
  ) {}

  async execute(userId: number): Promise<UserAppearance> {
    this.validateUserId(userId);

    // Repository returns default if not found
    const appearance = await this.appearanceRepository.getByUserId(userId);

    return appearance;
  }

  private validateUserId(userId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid userId: must be positive integer');
    }
  }
}
```

**UpdateUserAppearanceUseCase** (`domain/services/UpdateUserAppearanceUseCase.ts`):

```typescript
import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';
import { Theme, THEMES } from '@/domain/types/appearance';

export interface UpdateUserAppearanceInput {
  userId: number;
  theme: Theme;
}

export interface UpdateUserAppearanceResult {
  success: boolean;
  appearance: UserAppearance;
}

/**
 * UpdateUserAppearanceUseCase
 *
 * Updates user's theme preference with validation.
 * Persists to database for cross-device sync.
 *
 * Business Rules:
 * - Theme must be valid (light, dark, system)
 * - User must exist (validated by caller/middleware)
 * - Automatically creates record if not exists (upsert)
 */
export class UpdateUserAppearanceUseCase {
  constructor(
    private readonly appearanceRepository: IUserAppearanceRepository
  ) {}

  async execute(
    input: UpdateUserAppearanceInput
  ): Promise<UpdateUserAppearanceResult> {
    this.validateInput(input);

    const updatedAppearance = await this.appearanceRepository.updateTheme(
      input.userId,
      input.theme
    );

    return {
      success: true,
      appearance: updatedAppearance,
    };
  }

  private validateInput(input: UpdateUserAppearanceInput): void {
    if (!Number.isInteger(input.userId) || input.userId <= 0) {
      throw new Error('Invalid userId: must be positive integer');
    }

    const validThemes = Object.values(THEMES);
    if (!validThemes.includes(input.theme)) {
      throw new Error(
        `Invalid theme: ${input.theme}. Must be one of: ${validThemes.join(', ')}`
      );
    }
  }
}
```

**Why**:
- ✅ SRP: Each use case has one responsibility
- ✅ DIP: Depends on repository interface
- ✅ Testable: Easy to mock repository
- ✅ Validation: Business rules enforced

---

### Phase 2: Infrastructure Layer (External Dependencies)

**Objective**: Implement database persistence and client-side theme provider.

#### 2.1 Database Schema Migration

**Migration File**: `prisma/migrations/YYYYMMDD_add_user_appearance_preferences.sql`

```sql
-- Add theme preference column to users table
-- Default to 'system' (respects OS preference)

ALTER TABLE users
ADD COLUMN theme VARCHAR(10) DEFAULT 'system' NOT NULL
  CHECK (theme IN ('light', 'dark', 'system'));

-- Add index for performance
CREATE INDEX idx_users_theme ON users(theme);

-- Add updated_at trigger for appearance changes
-- (Optional: if you want to track when theme was last changed)
ALTER TABLE users
ADD COLUMN theme_updated_at TIMESTAMP DEFAULT NOW();
```

**Prisma Schema Update** (`prisma/schema.prisma`):

```prisma
model User {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  name             String?
  // ... existing fields ...

  // Appearance preferences
  theme            String    @default("system") // 'light' | 'dark' | 'system'
  theme_updated_at DateTime  @default(now()) @map("theme_updated_at")

  // ... rest of model ...
}
```

**Why**:
- ✅ Default to 'system': Respects user's OS preference initially
- ✅ Check constraint: Database-level validation
- ✅ Index: Fast lookups
- ✅ Optional timestamp: Audit trail

---

#### 2.2 PostgreSQL Repository Implementation

**File**: `infrastructure/database/repositories/PostgresUserAppearanceRepository.ts`

```typescript
import { sql } from '@vercel/postgres';
import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';
import { Theme, THEMES } from '@/domain/types/appearance';

interface UserAppearanceRow {
  id: number;
  theme: Theme;
  theme_updated_at: Date;
}

/**
 * PostgresUserAppearanceRepository
 *
 * PostgreSQL implementation of appearance persistence.
 * Implements DIP: domain depends on interface, not this class.
 */
export class PostgresUserAppearanceRepository
  implements IUserAppearanceRepository
{
  async getByUserId(userId: number): Promise<UserAppearance> {
    const result = await sql<UserAppearanceRow>`
      SELECT id, theme, theme_updated_at
      FROM users
      WHERE id = ${userId}
    `;

    if (result.rows.length === 0) {
      // User not found: return default
      return UserAppearance.createDefault(userId);
    }

    const row = result.rows[0];
    return UserAppearance.create({
      userId: row.id,
      theme: row.theme,
      updatedAt: row.theme_updated_at,
    });
  }

  async updateTheme(userId: number, theme: Theme): Promise<UserAppearance> {
    const now = new Date();

    const result = await sql<UserAppearanceRow>`
      UPDATE users
      SET
        theme = ${theme},
        theme_updated_at = ${now.toISOString()}
      WHERE id = ${userId}
      RETURNING id, theme, theme_updated_at
    `;

    if (result.rows.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    const row = result.rows[0];
    return UserAppearance.create({
      userId: row.id,
      theme: row.theme,
      updatedAt: row.theme_updated_at,
    });
  }

  async exists(userId: number): Promise<boolean> {
    const result = await sql`
      SELECT 1
      FROM users
      WHERE id = ${userId} AND theme != ${THEMES.SYSTEM}
    `;

    return result.rows.length > 0;
  }
}
```

**Why**:
- ✅ DIP: Implements interface from domain
- ✅ SRP: Only handles database operations
- ✅ Parameterized queries: SQL injection safe
- ✅ Error handling: Throws on user not found

---

#### 2.3 Theme Provider (Client-Side)

**File**: `infrastructure/theme/ThemeProvider.tsx`

```typescript
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
   * Priority: Cookie > Default
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
```

**Why**:
- ✅ SSR-compatible: No hydration flicker (matches server/client)
- ✅ Multi-layer persistence: Cookie (SSR) + localStorage (client)
- ✅ System theme detection: Respects OS preference
- ✅ React Context: Global access via `useTheme()`
- ✅ Follows i18n pattern: Familiar codebase structure

---

#### 2.4 Flicker Prevention Script

**File**: `infrastructure/theme/theme-script.ts`

```typescript
/**
 * Flicker Prevention Script
 *
 * Inlined in <head> to apply theme BEFORE first paint.
 * Must be synchronous (no async/await).
 *
 * Priority:
 * 1. Cookie value (SSR consistency)
 * 2. localStorage value
 * 3. System preference
 * 4. Default to 'light'
 */
export const themeScript = `
(function() {
  try {
    // Helper: get cookie value
    function getCookie(name) {
      const cookies = document.cookie.split('; ');
      const cookie = cookies.find(c => c.startsWith(name + '='));
      return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    }

    // Helper: detect system preference
    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Get theme (priority: cookie > localStorage > system > default)
    const cookieTheme = getCookie('BACKSTAGE_THEME');
    const storedTheme = localStorage.getItem('theme');
    const systemTheme = getSystemTheme();

    let theme = 'light'; // default

    if (cookieTheme && ['light', 'dark', 'system'].includes(cookieTheme)) {
      theme = cookieTheme === 'system' ? systemTheme : cookieTheme;
    } else if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      theme = storedTheme === 'system' ? systemTheme : storedTheme;
    } else {
      theme = systemTheme;
    }

    // Apply to DOM immediately
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // Fail gracefully: apply light theme
    document.documentElement.classList.add('light');
  }
})();
`;
```

**Usage in Layout**:

```tsx
// In app/layout.tsx
<head>
  <script dangerouslySetInnerHTML={{ __html: themeScript }} />
</head>
```

**Why**:
- ✅ Zero flicker: Runs before first paint
- ✅ Synchronous: No async delays
- ✅ Fail-safe: Defaults to light on error

---

### Phase 3: Presentation Layer (UI Components)

**Objective**: Add theme switcher to settings page and integrate provider.

#### 3.1 Update Root Layout

**File**: `app/layout.tsx`

```typescript
import { ThemeProvider } from '@/infrastructure/theme/ThemeProvider';
import { themeScript } from '@/infrastructure/theme/theme-script';
// ... existing imports ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Flicker prevention script */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${instrumentSerif.variable} ${inter.variable} antialiased transition-colors duration-200`}
      >
        <SessionProvider>
          <I18nProvider>
            <ThemeProvider defaultTheme="system">
              {children}
            </ThemeProvider>
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

**Changes**:
- ✅ Add `ThemeProvider` wrapper
- ✅ Add flicker prevention script
- ✅ Add `suppressHydrationWarning` to `<html>` (theme class mismatch is expected)
- ✅ Remove hardcoded `bg-[#FDFCF8]` (now handled by CSS)

---

#### 3.2 Update Global Styles

**File**: `app/globals.css`

```css
@import "tailwindcss";

/* Light theme (default) */
:root,
.light {
  --background: #FDFCF8;
  --foreground: #1c1c1c;
  --card: #FFFFFF;
  --card-foreground: #1c1c1c;
  --popover: #FFFFFF;
  --popover-foreground: #1c1c1c;
  --primary: #FF5500;
  --primary-foreground: #FFFFFF;
  --secondary: #F2F0E9;
  --secondary-foreground: #1c1c1c;
  --muted: #F2F0E9;
  --muted-foreground: #6B6B6B;
  --accent: #FF5500;
  --accent-foreground: #FFFFFF;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: #E8E6DF;
  --input: #E8E6DF;
  --ring: #FF5500;
  --radius: 0.5rem;
}

/* Dark theme */
.dark {
  --background: #0A0A0A;
  --foreground: #EDEDED;
  --card: #1A1A1A;
  --card-foreground: #EDEDED;
  --popover: #1A1A1A;
  --popover-foreground: #EDEDED;
  --primary: #FF6B2C; /* Slightly brighter for dark mode */
  --primary-foreground: #FFFFFF;
  --secondary: #262626;
  --secondary-foreground: #EDEDED;
  --muted: #262626;
  --muted-foreground: #A1A1A1;
  --accent: #FF6B2C;
  --accent-foreground: #FFFFFF;
  --destructive: #F87171;
  --destructive-foreground: #FFFFFF;
  --border: #2D2D2D;
  --input: #2D2D2D;
  --ring: #FF6B2C;
}

/* Base styles */
* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
  font-feature-settings: "rlig" 1, "calt" 1;
}

/* Scrollbar (adaptive) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-muted;
}

::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}

/* Aurora gradient (adaptive) */
.bg-aurora {
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 0.3) 0%,
    hsl(var(--accent) / 0.2) 50%,
    hsl(var(--secondary)) 100%
  );
}

.bg-aurora-light {
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 0.1) 0%,
    hsl(var(--accent) / 0.05) 50%,
    hsl(var(--secondary)) 100%
  );
}

/* Animation */
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -50px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(50px, 50px) scale(1.05); }
}

.animate-blob {
  animation: blob 7s infinite;
}
```

**Changes**:
- ✅ Add `.dark` theme variables
- ✅ Use `hsl(var(--primary))` for adaptive gradients
- ✅ Adaptive scrollbar colors
- ✅ Slightly brighter primary in dark mode (better contrast)

---

#### 3.3 Theme Switcher Component

**File**: `app/settings/ThemeSwitcher.tsx`

```tsx
'use client';

import { useTheme } from '@/infrastructure/theme/ThemeProvider';
import { THEMES, Theme } from '@/domain/types/appearance';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * ThemeSwitcher Component
 *
 * UI component for switching themes.
 * Updates both client-side (cookie/localStorage) and server-side (database).
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
```

**Why**:
- ✅ SRP: Only handles theme selection UI
- ✅ Optimistic UI: Updates immediately (no loading state)
- ✅ Fire-and-forget API: Doesn't block UI on database save
- ✅ Graceful degradation: Works even if API fails (cookie/localStorage)

---

#### 3.4 Integrate into Settings Page

**File**: `app/settings/SettingsClient.tsx`

```tsx
'use client';

import { ThemeSwitcher } from './ThemeSwitcher';
// ... existing imports ...

export function SettingsClient({ user }: SettingsClientProps) {
  return (
    <div className="space-y-8">
      {/* Existing settings sections */}

      {/* Appearance section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
        <ThemeSwitcher />
      </section>

      {/* ... rest of settings ... */}
    </div>
  );
}
```

---

#### 3.5 API Route (Orchestration Only)

**File**: `app/api/user/appearance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { UpdateUserAppearanceUseCase } from '@/domain/services/UpdateUserAppearanceUseCase';
import { PostgresUserAppearanceRepository } from '@/infrastructure/database/repositories/PostgresUserAppearanceRepository';
import { Theme, THEMES } from '@/domain/types/appearance';

/**
 * PATCH /api/user/appearance
 *
 * Update user's theme preference.
 * Presentation layer: ONLY orchestration, NO business logic.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { theme } = body;

    // Validate theme
    if (!theme || !Object.values(THEMES).includes(theme as Theme)) {
      return NextResponse.json(
        { error: 'Invalid theme. Must be: light, dark, or system' },
        { status: 400 }
      );
    }

    // Execute Use Case
    const appearanceRepository = new PostgresUserAppearanceRepository();
    const updateAppearanceUseCase = new UpdateUserAppearanceUseCase(
      appearanceRepository
    );

    const result = await updateAppearanceUseCase.execute({
      userId: Number(session.user.id),
      theme: theme as Theme,
    });

    return NextResponse.json({
      success: result.success,
      theme: result.appearance.theme,
    });
  } catch (error) {
    console.error('Error updating appearance:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/appearance
 *
 * Get user's theme preference.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appearanceRepository = new PostgresUserAppearanceRepository();
    const appearance = await appearanceRepository.getByUserId(
      Number(session.user.id)
    );

    return NextResponse.json({
      theme: appearance.theme,
      updatedAt: appearance.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching appearance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Why**:
- ✅ SRP: Only orchestration (auth → validate → execute use case)
- ✅ No business logic in API route
- ✅ Error handling with proper status codes
- ✅ Type-safe (uses THEMES constants)

---

### Phase 4: Testing

**Objective**: Ensure robustness with unit and integration tests.

#### 4.1 Unit Tests (Use Cases)

**File**: `domain/services/__tests__/UpdateUserAppearanceUseCase.test.ts`

```typescript
import { UpdateUserAppearanceUseCase } from '../UpdateUserAppearanceUseCase';
import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';
import { THEMES } from '@/domain/types/appearance';

// Mock Repository
class MockUserAppearanceRepository implements IUserAppearanceRepository {
  private appearances = new Map<number, UserAppearance>();

  async getByUserId(userId: number): Promise<UserAppearance> {
    return this.appearances.get(userId) || UserAppearance.createDefault(userId);
  }

  async updateTheme(userId: number, theme: Theme): Promise<UserAppearance> {
    const appearance = UserAppearance.create({
      userId,
      theme,
      updatedAt: new Date(),
    });
    this.appearances.set(userId, appearance);
    return appearance;
  }

  async exists(userId: number): Promise<boolean> {
    return this.appearances.has(userId);
  }
}

describe('UpdateUserAppearanceUseCase', () => {
  let useCase: UpdateUserAppearanceUseCase;
  let repository: MockUserAppearanceRepository;

  beforeEach(() => {
    repository = new MockUserAppearanceRepository();
    useCase = new UpdateUserAppearanceUseCase(repository);
  });

  it('should update theme to dark mode', async () => {
    const result = await useCase.execute({
      userId: 1,
      theme: THEMES.DARK,
    });

    expect(result.success).toBe(true);
    expect(result.appearance.theme).toBe(THEMES.DARK);
    expect(result.appearance.userId).toBe(1);
  });

  it('should update theme to system', async () => {
    const result = await useCase.execute({
      userId: 1,
      theme: THEMES.SYSTEM,
    });

    expect(result.success).toBe(true);
    expect(result.appearance.theme).toBe(THEMES.SYSTEM);
  });

  it('should reject invalid theme', async () => {
    await expect(
      useCase.execute({
        userId: 1,
        theme: 'invalid' as any,
      })
    ).rejects.toThrow('Invalid theme');
  });

  it('should reject invalid userId', async () => {
    await expect(
      useCase.execute({
        userId: -1,
        theme: THEMES.DARK,
      })
    ).rejects.toThrow('Invalid userId');
  });
});
```

**Why**:
- ✅ Easy testing: Mock repository (no database)
- ✅ Tests business logic only
- ✅ Fast execution
- ✅ Covers edge cases

---

#### 4.2 Integration Tests (API Route)

**File**: `app/api/user/appearance/__tests__/route.test.ts`

```typescript
import { PATCH, GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { THEMES } from '@/domain/types/appearance';

// Mock NextAuth
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('PATCH /api/user/appearance', () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
    } as any);
  });

  it('should update theme to dark mode', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/appearance', {
      method: 'PATCH',
      body: JSON.stringify({ theme: THEMES.DARK }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.theme).toBe(THEMES.DARK);
  });

  it('should reject invalid theme', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/appearance', {
      method: 'PATCH',
      body: JSON.stringify({ theme: 'invalid' }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid theme');
  });

  it('should reject unauthenticated requests', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/user/appearance', {
      method: 'PATCH',
      body: JSON.stringify({ theme: THEMES.DARK }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
```

---

### Phase 5: Documentation

**Objective**: Document usage and migration guide.

#### 5.1 Update Project README

Add to `.claude/CLAUDE.md`:

```markdown
## Dark Mode Architecture

This project implements dark mode using Clean Architecture + SOLID principles.

### Quick Start

**Use the theme hook**:
```tsx
'use client';

import { useTheme } from '@/infrastructure/theme/ThemeProvider';

export function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme('dark')}>
      Current: {resolvedTheme}
    </button>
  );
}
```

**Use CSS variables**:
```css
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}
```

**Use Tailwind utilities**:
```tsx
<div className="bg-background text-foreground border-border">
  Adaptive colors
</div>
```

### Architecture

- **Domain**: `domain/entities/UserAppearance.ts`, `domain/services/*AppearanceUseCase.ts`
- **Infrastructure**: `infrastructure/database/repositories/PostgresUserAppearanceRepository.ts`
- **Presentation**: `app/settings/ThemeSwitcher.tsx`, `app/api/user/appearance/route.ts`

### Constants

**ALWAYS use typed constants**:
```typescript
import { THEMES } from '@/domain/types/appearance';

// ✅ CORRECT
if (theme === THEMES.DARK) { ... }

// ❌ WRONG
if (theme === 'dark') { ... }
```

### Testing

```bash
# Run tests
npm test

# Test dark mode visually
# 1. Go to /settings
# 2. Click "Dark" theme
# 3. Verify no flicker on page reload
```
```

---

## 📊 SOLID Compliance Matrix

| Principle | Implementation | Evidence |
|-----------|----------------|----------|
| **SRP** | Each class has one responsibility | `UserAppearance` = validation, `PostgresUserAppearanceRepository` = DB, `ThemeSwitcher` = UI |
| **OCP** | Open for extension, closed for modification | Add new themes without changing use cases; add new repositories without changing domain |
| **LSP** | Repositories are substitutable | `PostgresUserAppearanceRepository` and `MockUserAppearanceRepository` both implement `IUserAppearanceRepository` |
| **ISP** | Minimal interfaces | `IUserAppearanceRepository` has only 3 methods (get, update, exists) |
| **DIP** | Depend on abstractions | Use cases depend on `IUserAppearanceRepository` interface, not concrete implementation |

---

## 🎨 Color Palette

### Light Theme
- Background: `#FDFCF8` (Cream)
- Foreground: `#1c1c1c` (Almost black)
- Primary: `#FF5500` (Orange)
- Border: `#E8E6DF`

### Dark Theme
- Background: `#0A0A0A` (Near black)
- Foreground: `#EDEDED` (Off-white)
- Primary: `#FF6B2C` (Brighter orange for contrast)
- Border: `#2D2D2D`

---

## 🚀 Implementation Checklist

### Phase 1: Domain Layer
- [ ] Create `domain/types/appearance.ts` (typed constants)
- [ ] Create `domain/entities/UserAppearance.ts` (entity)
- [ ] Create `domain/repositories/IUserAppearanceRepository.ts` (interface)
- [ ] Create `domain/services/GetUserAppearanceUseCase.ts` (use case)
- [ ] Create `domain/services/UpdateUserAppearanceUseCase.ts` (use case)

### Phase 2: Infrastructure Layer
- [ ] Run database migration (add `theme` column)
- [ ] Update Prisma schema
- [ ] Create `infrastructure/database/repositories/PostgresUserAppearanceRepository.ts`
- [ ] Create `infrastructure/theme/ThemeProvider.tsx`
- [ ] Create `infrastructure/theme/theme-script.ts` (flicker prevention)

### Phase 3: Presentation Layer
- [ ] Update `app/layout.tsx` (add ThemeProvider)
- [ ] Update `app/globals.css` (dark theme variables)
- [ ] Create `app/settings/ThemeSwitcher.tsx`
- [ ] Update `app/settings/SettingsClient.tsx`
- [ ] Create `app/api/user/appearance/route.ts`

### Phase 4: Testing
- [ ] Write unit tests for `UpdateUserAppearanceUseCase`
- [ ] Write integration tests for API route
- [ ] Manual testing: flicker-free theme switching

### Phase 5: Documentation
- [ ] Update `.claude/CLAUDE.md` with dark mode usage
- [ ] Add JSDoc comments to all files
- [ ] Create migration guide for existing components

---

## 🔍 Trade-offs and Decisions

### Decision 1: Cookie + Database Persistence

**Options Considered**:
1. Cookie only (no database)
2. Database only (no cookie)
3. Cookie + Database (chosen)

**Chosen**: Cookie + Database

**Rationale**:
- **Robustness**: Cookie ensures SSR consistency, database enables cross-device sync
- **Correctness**: Cookie prevents flicker, database persists long-term preference
- **Maintainability**: Mirrors i18n pattern (familiar to team)

**Trade-off**: Slight complexity increase (two storage layers), but negligible maintenance burden.

---

### Decision 2: System Theme as Default

**Options Considered**:
1. Default to light theme
2. Default to dark theme
3. Default to system theme (chosen)

**Chosen**: System theme

**Rationale**:
- **Robustness**: Respects user's OS preference (better UX)
- **Correctness**: Aligns with modern web standards (prefers-color-scheme)
- **Accessibility**: Reduces eye strain for users with dark mode OS

**Trade-off**: None (strictly better UX).

---

### Decision 3: Flicker Prevention Script

**Options Considered**:
1. No script (accept flicker)
2. Inline script in `<head>` (chosen)
3. External script file

**Chosen**: Inline script in `<head>`

**Rationale**:
- **Robustness**: Zero flicker (executes before first paint)
- **Correctness**: Critical for UX (flicker is jarring)
- **Performance**: Synchronous execution (no async delay)

**Trade-off**: Slightly larger HTML size (negligible: ~500 bytes gzipped).

---

### Decision 4: CSS Variables vs Tailwind Variants

**Options Considered**:
1. CSS variables (chosen)
2. Tailwind `dark:` variants
3. CSS-in-JS

**Chosen**: CSS variables

**Rationale**:
- **Robustness**: Single source of truth (all colors in `globals.css`)
- **Maintainability**: Easy to update palette globally
- **Performance**: No runtime overhead (CSS-in-JS has runtime cost)

**Trade-off**: Requires updating `globals.css` for new colors (acceptable).

---

## 🐛 Edge Cases Handled

1. **User not authenticated**: API returns 401
2. **Invalid theme value**: Validation error
3. **Database save fails**: Client-side theme still works (cookie/localStorage)
4. **System theme changes**: MediaQuery listener updates theme automatically
5. **Hydration mismatch**: `suppressHydrationWarning` prevents React error
6. **First visit (no preference)**: Defaults to system theme
7. **Cookie disabled**: Falls back to localStorage
8. **JavaScript disabled**: Light theme (graceful degradation)

---

## 📈 Performance Impact

- **Initial page load**: +500 bytes (gzipped script)
- **Runtime overhead**: Negligible (CSS variables are native)
- **Database queries**: +1 query on settings page load (cached)
- **Flicker**: Zero (script runs before first paint)

---

## 🔐 Security Considerations

- ✅ **Input validation**: Theme values validated in use case
- ✅ **SQL injection**: Parameterized queries (Vercel Postgres)
- ✅ **XSS**: React auto-escapes (no user-generated HTML)
- ✅ **CSRF**: Not applicable (authenticated API with session)
- ✅ **Cookie security**: `SameSite=Lax` (prevents CSRF)

---

## 🎓 Learning Resources

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Next.js Theming](https://nextjs.org/docs/app/building-your-application/styling/css-variables)

---

## 🚀 Future Enhancements

**Out of scope for initial implementation, but possible future improvements**:

1. **Custom color themes**: Allow users to create custom color palettes
2. **Automatic theme switching**: Switch based on time of day
3. **Per-page themes**: Different themes for different sections
4. **Accessibility presets**: High contrast mode, reduced motion
5. **Theme preview**: Live preview before saving

**Note**: These enhancements can be added WITHOUT modifying existing code (Open/Closed Principle).

---

## ✅ Acceptance Criteria

- [ ] User can switch between light, dark, and system themes
- [ ] Theme preference persists across sessions (cookie + database)
- [ ] Theme preference syncs across devices (database)
- [ ] Zero flicker on page load
- [ ] System theme changes are detected automatically
- [ ] All components use CSS variables (adaptive colors)
- [ ] API endpoint follows Clean Architecture (no business logic)
- [ ] Unit tests pass for use cases
- [ ] Integration tests pass for API route
- [ ] Code follows SOLID principles
- [ ] Documentation updated

---

**End of Plan**

**Estimated Files to Create**: 15
**Estimated Files to Modify**: 3
**Estimated Lines of Code**: ~800 (excluding tests)

**Architecture Compliance**: ✅ Clean Architecture + SOLID
**Pattern Consistency**: ✅ Mirrors i18n implementation
**Type Safety**: ✅ Typed constants throughout
**Testing Strategy**: ✅ Unit + Integration tests
**Performance**: ✅ Zero flicker, minimal overhead
**Security**: ✅ Input validation, SQL injection prevention

**Ready for Implementation**: ✅

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
 *
 * USAGE:
 * ```tsx
 * // In app/layout.tsx
 * import { themeScript } from '@/infrastructure/theme/theme-script';
 *
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: themeScript }} />
 * </head>
 * ```
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

    // Apply to DOM immediately (before first paint)
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // Fail gracefully: apply light theme
    document.documentElement.classList.add('light');
  }
})();
`;

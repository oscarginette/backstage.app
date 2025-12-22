import { cookies, headers } from 'next/headers';

export type Locale = 'en' | 'es';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'es'];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Detects user's preferred locale on the server side.
 *
 * Priority:
 * 1. Cookie (NEXT_LOCALE)
 * 2. Accept-Language header
 * 3. Default to 'en'
 */
export async function getLocale(): Promise<Locale> {
  // Priority 1: Check cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Priority 2: Check Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [locale, qValue] = lang.trim().split(';');
        const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
        return { locale: locale.split('-')[0], quality };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first supported locale
    for (const { locale } of languages) {
      if (SUPPORTED_LOCALES.includes(locale as Locale)) {
        return locale as Locale;
      }
    }
  }

  // Priority 3: Default
  return DEFAULT_LOCALE;
}

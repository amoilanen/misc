import { GetStaticPropsContext } from 'next';

export const SUPPORTED_LOCALES = ['en', 'fi'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const LANGUAGE_PREFERENCE_KEY = 'preferred-language';

export function getUserPreferredLanguage(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  return stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale) 
    ? stored as SupportedLocale 
    : null;
}

export function setUserPreferredLanguage(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANGUAGE_PREFERENCE_KEY, locale);
}

export function getBrowserLanguage(): SupportedLocale {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.toLowerCase();
  // Check if the browser language is Finnish or starts with 'fi'
  if (browserLang === 'fi' || browserLang.startsWith('fi-')) {
    return 'fi';
  }
  // Default to English for all other languages
  return 'en';
}

export function getInitialLocale(context: GetStaticPropsContext): SupportedLocale {
  // If locale is provided in the URL, use it
  if (context.locale && SUPPORTED_LOCALES.includes(context.locale as SupportedLocale)) {
    return context.locale as SupportedLocale;
  }

  // If we're on the server, use the default locale
  if (typeof window === 'undefined') {
    return 'en';
  }

  // Check for user's preferred language
  const userPreferred = getUserPreferredLanguage();
  if (userPreferred) {
    return userPreferred;
  }

  // On the client, detect browser language
  return getBrowserLanguage();
} 
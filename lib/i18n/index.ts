import ar, { type Dict } from './ar';
import en from './en';

export type Locale = 'ar' | 'en';

export const locales: Locale[] = ['ar', 'en'];
export const defaultLocale: Locale = 'ar';

export type { Dict };

export function isLocale(v: string | undefined | null): v is Locale {
  return v === 'ar' || v === 'en';
}

export function getDictionary(locale: Locale): Dict {
  return locale === 'en' ? en : ar;
}

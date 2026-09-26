'use client';
import { createContext, useContext } from 'react';
import type { Dict, Locale } from '@/lib/i18n';

export type { Dict, Locale };

const DictContext = createContext<Dict | null>(null);
const LocaleContext = createContext<Locale>('ar');

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <DictContext.Provider value={dict}>{children}</DictContext.Provider>
    </LocaleContext.Provider>
  );
}

/** Current dictionary (all UI strings). */
export function useT(): Dict {
  const dict = useContext(DictContext);
  if (!dict) throw new Error('useT must be used inside <I18nProvider>');
  return dict;
}

/** Current locale code ('ar' | 'en'). */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

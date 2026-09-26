import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Providers } from '../providers';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { I18nProvider } from '@/components/i18n-provider';
import { locales, getDictionary, type Locale } from '@/lib/i18n';

/**
 * Arabic-first typeface for `ar` — IBM Plex Sans Arabic, self-hosted from
 * `public/fonts` (downloaded from Google Fonts) so Arabic renders perfectly
 * even offline. Inter (Google Fonts) for `en`.
 */
const arabicFont = localFont({
  src: [
    { path: '../../public/fonts/ibm-plex-sans-arabic-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/ibm-plex-sans-arabic-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/ibm-plex-sans-arabic-600.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/ibm-plex-sans-arabic-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
});

const latinFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en'
    ? {
        title: 'MedFlow — Book your appointment',
        description: 'Medical Appointment & Clinic Management Platform',
      }
    : {
        title: 'MedFlow — احجز موعدك',
        description: 'Medical Appointment & Clinic Management Platform',
      };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (raw !== 'ar' && raw !== 'en') notFound();
  const locale = raw as Locale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`flex min-h-screen flex-col bg-background text-foreground ${
          locale === 'ar' ? arabicFont.className : latinFont.className
        }`}
      >
        <Providers>
          <I18nProvider locale={locale} dict={dict}>
            <SiteHeader locale={locale} />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}

import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';

function preferredLocale(req: NextRequest): string {
  const header = req.headers.get('accept-language') ?? '';
  const first = header.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
  if (first === 'en') return 'en';
  return defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Already localized → nothing to do.
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next();
  }

  const locale = preferredLocale(req);
  return NextResponse.redirect(new URL(`/${locale}${pathname === '/' ? '' : pathname}`, req.url));
}

export const config = {
  // Skip static assets, next internals and API-ish paths.
  matcher: ['/((?!_next|api|images|favicon.ico|.*\\..*).*)'],
};

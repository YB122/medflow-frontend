'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, LogOut, LayoutDashboard, Search, MessageCircle, Stethoscope, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth, logout, dashboardPath } from '@/lib/store';
import { useT, type Locale } from '@/components/i18n-provider';

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, roles, clear } = useAuth();
  const authed = !!accessToken;

  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const switchHref = pathname.replace(/^\/(ar|en)/, `/${other}`) || `/${other}`;

  const links = [
    { href: `/${locale}/doctors`, label: t.nav.doctors, icon: Search },
    ...(authed ? [{ href: dashboardPath(roles, locale), label: t.nav.dashboard, icon: LayoutDashboard }] : []),
    ...(authed ? [{ href: `/${locale}/chat`, label: t.nav.chat, icon: MessageCircle }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-blue-900/30">
            <Activity className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight" dir="ltr">{t.common.appName}</span>
            <span className="text-[11px] text-muted-foreground">{t.common.tagline}</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Button variant={pathname === l.href ? 'secondary' : 'ghost'} size="sm">
                <l.icon />
                <span className="hidden sm:inline">{l.label}</span>
              </Button>
            </Link>
          ))}
          <Link href={switchHref} title={t.nav.langName}>
            <Button variant="outline" size="sm" dir="ltr">
              <Languages />
              {other === 'ar' ? 'عربي' : 'EN'}
            </Button>
          </Link>
          {authed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                clear();
                router.push(`/${locale}`);
              }}
            >
              <LogOut />
              <span className="hidden sm:inline">{t.nav.logout}</span>
            </Button>
          ) : (
            <>
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">{t.nav.login}</Button>
              </Link>
              <Link href={`/${locale}/register`} className="hidden sm:block">
                <Button size="sm">
                  <Stethoscope />
                  {t.nav.register}
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/store';
import { useLocale } from './i18n-provider';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

/** Where to send a user whose role doesn't belong on the current page. */
function homeFor(roles: string[], locale: string): string {
  if (roles.includes('PATIENT')) return `/${locale}/dashboard/patient`;
  if (roles.includes('DOCTOR')) return `/${locale}/dashboard/doctor`;
  if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return `/${locale}/dashboard/admin`;
  return `/${locale}/doctors`;
}

/**
 * Client-side route guard mirroring backend RBAC:
 * - waits for auth rehydration (no login flash for persisted sessions),
 * - signed-out users → login,
 * - wrong-role users → their own dashboard (e.g. a doctor opening
 *   /dashboard/patient lands on /dashboard/doctor).
 * Children mount only when authorized, so their queries never fire otherwise.
 */
export function RequireRole({ allow, children }: { allow: string[]; children: ReactNode }) {
  const locale = useLocale();
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const roles = useAuth((s) => s.roles);
  const [hydrated, setHydrated] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (useAuth.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuth.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(`/${locale}/login`);
      return;
    }
    if (!allow.some((r) => roles.includes(r))) {
      router.replace(homeFor(roles, locale));
      return;
    }
    setAllowed(true);
  }, [hydrated, accessToken, roles, allow, locale, router]);

  if (!hydrated || !allowed) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Card className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <ShieldAlert className="size-5 shrink-0 text-primary" />
          <span className="flex-1">…</span>
        </Card>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </main>
    );
  }
  return <>{children}</>;
}

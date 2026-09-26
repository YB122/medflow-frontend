'use client';
import Link from 'next/link';
import { Activity, HeartPulse, ShieldCheck, BellRing } from 'lucide-react';
import { useT, useLocale } from './i18n-provider';

export function SiteFooter() {
  const t = useT();
  const locale = useLocale();
  const L = (p: string) => `/${locale}${p}`;

  return (
    <footer className="mt-20 border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span className="text-base font-extrabold" dir="ltr">{t.common.appName}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.footer.about}</p>
        </div>
        <div>
          <p className="text-sm font-bold">{t.footer.forPatients}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href={L('/doctors')} className="hover:text-primary">{t.footer.findDoctor}</Link></li>
            <li><Link href={L('/dashboard/patient')} className="hover:text-primary">{t.footer.myAppts}</Link></li>
            <li><Link href={L('/chat')} className="hover:text-primary">{t.footer.doctorChat}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">{t.footer.forDoctors}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href={L('/dashboard/doctor')} className="hover:text-primary">{t.footer.doctorDash}</Link></li>
            <li><Link href={L('/register?type=doctor')} className="hover:text-primary">{t.footer.joinDoctor}</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><HeartPulse className="size-4 shrink-0 text-primary" /> {t.footer.trust1}</p>
          <p className="flex items-center gap-2"><BellRing className="size-4 shrink-0 text-primary" /> {t.footer.trust2}</p>
          <p className="flex items-center gap-2"><ShieldCheck className="size-4 shrink-0 text-primary" /> {t.footer.trust3}</p>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground" dir="ltr">
        {t.footer.rights}
      </div>
    </footer>
  );
}

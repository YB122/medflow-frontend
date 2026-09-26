'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Activity, Quote } from 'lucide-react';
import { Card } from './ui/card';
import { useT, useLocale } from './i18n-provider';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const t = useT();
  const locale = useLocale();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="grid overflow-hidden md:grid-cols-2">
          {/* form side */}
          <div className="p-7 sm:p-9">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="size-4" />
              </span>
              <span className="font-extrabold" dir="ltr">{t.common.appName}</span>
            </Link>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          </div>
          {/* image side */}
          <div className="relative hidden min-h-[480px] md:block">
            <Image src="/images/auth-side.jpg" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/30 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 text-white">
              <Quote className="size-6 text-blue-300" />
              <p className="mt-2 text-lg font-bold leading-8">{t.auth.quote}</p>
              <p className="mt-2 text-sm text-blue-100/80">{t.auth.quoteBy}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}

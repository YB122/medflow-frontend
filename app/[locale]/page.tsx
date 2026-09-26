'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  HeartPulse,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  Baby,
  Brain,
  Bone,
  Eye,
  Syringe,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { useT, useLocale } from '@/components/i18n-provider';

const SPEC_ICONS = [HeartPulse, Baby, Brain, Bone, Eye, Syringe];
const STEP_ICONS = [Search, CalendarCheck, BellRing];

export default function Home() {
  const t = useT();
  const locale = useLocale();
  const L = (p: string) => `/${locale}${p}`;
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <main>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-60" />
        <div className="absolute -top-32 start-1/4 size-96 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 end-1/4 size-80 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Sparkles className="size-3.5" />
              {t.home.badge}
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.35] tracking-tight sm:text-5xl">
              {t.home.titleA}{' '}
              <span className="relative whitespace-nowrap text-primary">
                {t.home.titleB}
                <svg className="absolute -bottom-2 start-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M2 8 Q 100 -2 198 6" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-lg leading-8 text-muted-foreground">{t.home.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={L('/doctors')}>
                <Button size="lg">
                  <Search />
                  {t.home.ctaFind}
                  <Arrow className="size-4" />
                </Button>
              </Link>
              <Link href={L('/register')}>
                <Button size="lg" variant="outline">{t.home.ctaRegister}</Button>
              </Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4">
              {[
                ['+120', t.home.statDoctors],
                ['+8.9k', t.home.statBookings],
                ['4.8', t.home.statRating],
              ].map(([v, k]) => (
                <div key={k} className="rounded-xl border border-border/70 bg-card/70 px-3 py-3 text-center backdrop-blur">
                  <dt className="sr-only">{k}</dt>
                  <dd className="text-2xl font-extrabold text-primary" dir="ltr">{v}</dd>
                  <dd className="mt-0.5 text-xs text-muted-foreground">{k}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl shadow-blue-900/20">
              <Image
                src="/images/hero-doctor.jpg"
                alt=""
                width={1200}
                height={900}
                className="aspect-[4/3.4] w-full object-cover"
                priority
              />
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-5 start-4"
            >
              <Card className="flex items-center gap-3 border-white/60 bg-white/95 p-3 pe-4 shadow-xl backdrop-blur">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CalendarCheck className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{t.home.bookingConfirmed}</span>
                  <span className="block text-xs text-muted-foreground" dir="ltr">Tue 10:30 · Dr. Ahmed</span>
                </span>
              </Card>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -top-4 end-4"
            >
              <Card className="flex items-center gap-2 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-extrabold" dir="ltr">4.8</span>
                <span className="text-xs text-muted-foreground">{t.home.patientsRating}</span>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- SPECIALTIES ---------- */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-primary">{t.home.specKicker}</p>
              <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{t.home.specTitle}</h2>
            </div>
            <Link href={L('/doctors')}>
              <Button variant="ghost" size="sm">{t.home.allDoctors} <Arrow className="size-4" /></Button>
            </Link>
          </div>
        </FadeIn>
        <Stagger className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {t.home.specs.map((s, i) => {
            const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
            const colors = [
              'bg-rose-100 text-rose-700',
              'bg-sky-100 text-sky-700',
              'bg-violet-100 text-violet-700',
              'bg-amber-100 text-amber-700',
              'bg-cyan-100 text-cyan-700',
              'bg-emerald-100 text-emerald-700',
            ];
            return (
              <StaggerItem key={s.en}>
                <Link href={L('/doctors')}>
                  <Card className="group p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10">
                    <span className={`mx-auto flex size-12 items-center justify-center rounded-2xl ${colors[i % colors.length]} transition-transform group-hover:scale-110`}>
                      <Icon className="size-6" />
                    </span>
                    <p className="mt-3 text-sm font-bold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{s.en}</p>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <FadeIn className="text-center">
          <p className="text-sm font-bold text-primary">{t.home.stepsKicker}</p>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{t.home.stepsTitle}</h2>
        </FadeIn>
        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {t.home.steps.map((s, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <StaggerItem key={s.title}>
                <Card className="relative h-full overflow-hidden p-6">
                  <span className="absolute -top-3 end-3 text-7xl font-extrabold text-muted/80" dir="ltr">0{i + 1}</span>
                  <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-blue-900/25">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="relative mt-4 font-extrabold">{s.title}</h3>
                  <p className="relative mt-1.5 text-sm leading-7 text-muted-foreground">{s.text}</p>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ---------- DOCTOR CTA / CLINIC ---------- */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <Card className="grid overflow-hidden md:grid-cols-2">
            <div className="relative min-h-64">
              <Image src="/images/clinic.jpg" alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/50 to-transparent md:bg-gradient-to-l" />
              <div className="absolute bottom-4 start-4 flex items-center gap-2">
                <Avatar className="size-11 border-2 border-white">
                  <AvatarImage src="/images/doctor-1.jpg" alt="" />
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <Avatar className="size-11 -ms-5 border-2 border-white">
                  <AvatarImage src="/images/doctor-2.jpg" alt="" />
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <Avatar className="size-11 -ms-5 border-2 border-white">
                  <AvatarImage src="/images/doctor-4.jpg" alt="" />
                  <AvatarFallback>DR</AvatarFallback>
                </Avatar>
                <Badge variant="secondary" className="ms-1 bg-white/95">{t.home.doctorsCount}</Badge>
              </div>
            </div>
            <CardContent className="flex flex-col justify-center gap-4 p-8">
              <Badge variant="secondary" className="w-fit gap-1.5">
                <Stethoscope className="size-3.5" /> {t.home.clinicBadge}
              </Badge>
              <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl">{t.home.clinicTitle}</h2>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {t.home.clinicPoints.map((pt) => (
                  <li key={pt} className="flex items-center gap-2">
                    <BadgeCheck className="size-4 shrink-0 text-primary" /> {pt}
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex gap-3">
                <Link href={L('/register?type=doctor')}><Button>{t.home.clinicCtaJoin} <Arrow className="size-4" /></Button></Link>
                <Link href={L('/dashboard/doctor')}><Button variant="outline">{t.home.clinicCtaTry}</Button></Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      {/* ---------- TRUST BAND ---------- */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <Stagger className="grid gap-4 sm:grid-cols-3">
          {[ShieldCheck, MessageCircle, BadgeCheck].map((Icon, i) => (
            <StaggerItem key={t.home.trust[i].t}>
              <Card className="flex gap-3 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{t.home.trust[i].t}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{t.home.trust[i].d}</span>
                </span>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn className="mt-10">
          <Card className="relative overflow-hidden border border-transparent bg-blue-950 text-white dark:border-blue-900">
            <div className="dot-grid absolute inset-0 opacity-20" />
            <CardContent className="relative flex flex-col items-center gap-4 p-10 text-center">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t.home.finalTitle}</h2>
              <p className="max-w-md text-sm leading-7 text-blue-100/80">{t.home.finalSub}</p>
              <div className="flex gap-3">
                <Link href={L('/doctors')}><Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">{t.home.finalBook}</Button></Link>
                <Link href={L('/login')}><Button size="lg" variant="outline" className="border-blue-700 bg-transparent text-white hover:bg-blue-900 hover:text-white">{t.home.finalLogin}</Button></Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </section>
    </main>
  );
}

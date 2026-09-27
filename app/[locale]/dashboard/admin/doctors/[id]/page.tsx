'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, MapPin, Wallet, Award, CalendarDays, Star,
  ShieldCheck, UserX, UserCheck, Check, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { api } from '@/lib/store';
import { portraitFor, initialsOf } from '@/lib/doctors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { RequireRole } from '@/components/require-role';
import { useT, useLocale } from '@/components/i18n-provider';

const APPT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

export default function AdminDoctorDetailPage({ params }: { params: { locale: string; id: string } }) {
  return (
    <RequireRole allow={['ADMIN', 'SUPER_ADMIN']}>
      <Detail id={params.id} />
    </RequireRole>
  );
}

function Detail({ id }: { id: string }) {
  const t = useT();
  const locale = useLocale();
  const L = (p: string) => `/${locale}${p}`;
  const Back = locale === 'ar' ? ChevronRight : ChevronLeft;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin-doctor', id],
    queryFn: () => api<any>(`/admin/doctors/${id}`),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-doctor', id] });
  const verify = useMutation({
    mutationFn: (v: boolean) => api(`/doctors/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified: v }) }),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: ({ uid, status }: { uid: string; status: string }) =>
      api(`/users/${uid}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: invalidate,
  });

  const d = q.data?.doctor;
  const user = d && typeof d.userId === 'object' ? d.userId : null;
  const uid: string | undefined = user?._id ?? (typeof d?.userId === 'string' ? d.userId : undefined);
  const byStatus: Record<string, number> = q.data?.stats?.byStatus ?? {};
  const specialty = typeof d?.specialtyId === 'object' ? d.specialtyId?.name : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href={L('/dashboard/admin')}>
        <Button variant="ghost" size="sm"><Back /> {t.admin.back}</Button>
      </Link>

      {q.isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : q.isError ? (
        <Card className="mt-4 p-10 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-extrabold">{t.common.backendDown}</p>
          <Button className="mt-4" onClick={() => q.refetch()}>{t.common.retry}</Button>
        </Card>
      ) : !d ? (
        <Card className="mt-4 p-10 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-extrabold" dir="ltr">404 — doctor not found</p>
          <Link href={L('/dashboard/admin')}>
            <Button variant="outline" size="sm" className="mt-4"><Back /> {t.admin.back}</Button>
          </Link>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          {/* ---------- identity ---------- */}
          <Card className="mt-4 overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <Avatar className="size-20 rounded-2xl">
                <AvatarImage src={portraitFor(d._id, d.photoUrl || user?.photoUrl)} alt="" />
                <AvatarFallback className="text-lg">{initialsOf(d.bio)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">
                  {d.bio || 'Doctor'}
                  {d.verified ? (
                    <Badge variant="success" className="gap-1"><BadgeCheck className="size-3.5" /> {t.admin.verified}</Badge>
                  ) : (
                    <Badge variant="warning">{t.admin.unverified}</Badge>
                  )}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {[user?.email, user?.phone].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {specialty && <span>{specialty}</span>}
                  {d.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {d.city}</span>}
                  {d.price != null && <span className="font-bold text-primary" dir="ltr">${d.price}</span>}
                  {d.yearsOfExperience != null && (
                    <span className="flex items-center gap-1" dir="ltr">
                      <Award className="size-3.5 text-primary" /> {d.yearsOfExperience} {t.profile.expSuffix}
                    </span>
                  )}
                </p>
                {user && (
                  <p className="mt-1.5 flex items-center gap-1.5">
                    <StatusBadge status={user.status} />
                    {(user.roles ?? []).map((r: any) => (
                      <Badge key={r.name ?? r} variant="secondary" className="text-[10px]" dir="ltr">{r.name ?? r}</Badge>
                    ))}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  size="sm"
                  variant={d.verified ? 'outline' : 'default'}
                  disabled={verify.isPending}
                  onClick={() => verify.mutate(!d.verified)}
                >
                  <Check /> {d.verified ? t.admin.unverify : t.admin.verify}
                </Button>
                {uid && user && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={user.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ uid, status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                  >
                    {user.status === 'ACTIVE' ? <UserX /> : <UserCheck />}
                    {user.status === 'ACTIVE' ? t.admin.suspend : t.admin.activate}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---------- booking stats ---------- */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                {t.admin.cardBookings} · <span dir="ltr">{q.data?.stats?.total ?? 0}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {APPT_STATUSES.map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
                  <StatusBadge status={s} />
                  <b className="text-sm" dir="ltr">{byStatus[s] ?? 0}</b>
                </span>
              ))}
            </CardContent>
          </Card>

          {/* ---------- schedule ---------- */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" /> {t.profile.weeklySchedule}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(q.data?.schedules ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(q.data?.schedules ?? []).map((w: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm" dir="ltr">
                      <span className="font-bold">{t.days[w.dayOfWeek] ?? `Day ${w.dayOfWeek}`}</span>
                      <span className="text-muted-foreground">{w.start} – {w.end}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---------- reviews ---------- */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-5 text-amber-500" /> {t.profile.reviewsTitle} ({(q.data?.reviews ?? []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(q.data?.reviews ?? []).map((r: any) => (
                <div key={r._id} className="flex gap-2.5 rounded-lg bg-muted/50 p-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-[11px]">P</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-xs font-bold" dir="ltr">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {r.stars}/5
                    </p>
                    {r.comment && <p className="mt-0.5 text-sm leading-6" dir="ltr">{r.comment}</p>}
                  </div>
                </div>
              ))}
              {(q.data?.reviews ?? []).length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">{t.profile.noReviews}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </main>
  );
}

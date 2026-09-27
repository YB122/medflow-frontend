'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope, Users, CalendarDays, Banknote,
  UserX, UserCheck, ShieldCheck, BadgeCheck, Trophy, BarChart3, Plus, Check,
} from 'lucide-react';
import { api } from '@/lib/store';
import { portraitFor, initialsOf } from '@/lib/doctors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { Pager } from '@/components/pager';
import { RequireRole } from '@/components/require-role';
import { useT, useLocale } from '@/components/i18n-provider';

function Bars({ rows, valueKey, barClass, emptyLabel }: { rows: any[]; valueKey: string; barClass: string; emptyLabel: string }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey] ?? r.count ?? r.total ?? 0)));
  return (
    <div className="mt-3 space-y-1.5" dir="ltr">
      {rows.map((r: any, i: number) => {
        const v = Number(r[valueKey] ?? r.count ?? r.total ?? 0);
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0 font-mono text-muted-foreground">{r._id ?? i}</span>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(6, (v / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className={`h-4 max-w-full rounded-md ${barClass}`}
            />
            <span className="font-bold">{v}</span>
          </div>
        );
      })}
      {rows.length === 0 && <p className="py-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole allow={['ADMIN', 'SUPER_ADMIN']}>
      <AdminDashboard />
    </RequireRole>
  );
}

function AdminDashboard() {
  const t = useT();
  const locale = useLocale();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const USER_LIMIT = 20;
  const [docPage, setDocPage] = useState(1);
  const DOC_LIMIT = 10;
  const [specName, setSpecName] = useState('');
  const dash = useQuery({ queryKey: ['admin-dash'], queryFn: () => api<any>('/admin/dashboard') });
  const monthly = useQuery({ queryKey: ['admin-monthly'], queryFn: () => api<any>('/admin/reports/monthly') });
  const top = useQuery({ queryKey: ['admin-top'], queryFn: () => api<any[]>('/admin/reports/top-doctors') });
  const users = useQuery({ queryKey: ['admin-users', page], queryFn: () => api<any>(`/users?page=${page}&limit=${USER_LIMIT}`) });
  const doctors = useQuery({ queryKey: ['admin-doctors', docPage], queryFn: () => api<any>(`/admin/doctors?page=${docPage}&limit=${DOC_LIMIT}`) });
  const specs = useQuery({ queryKey: ['specs'], queryFn: () => api<any[]>('/specialties') });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-dash'] });
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    qc.invalidateQueries({ queryKey: ['admin-doctors'] });
  };
  const suspend = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: refreshAll,
  });
  const assignRoles = useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      api(`/users/${id}/roles`, { method: 'POST', body: JSON.stringify({ roles }) }),
    onSuccess: refreshAll,
  });
  const verify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api(`/doctors/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
    onSuccess: refreshAll,
  });
  const addSpec = useMutation({
    mutationFn: () => api('/specialties', { method: 'POST', body: JSON.stringify({ name: specName.trim() }) }),
    onSuccess: () => {
      setSpecName('');
      qc.invalidateQueries({ queryKey: ['specs'] });
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
  });

  const cards = dash.data
    ? [
        { icon: Stethoscope, label: t.admin.cardDoctors, value: dash.data.cards.doctors, cls: 'bg-sky-100 text-sky-700' },
        { icon: Users, label: t.admin.cardPatients, value: dash.data.cards.patients, cls: 'bg-violet-100 text-violet-700' },
        { icon: CalendarDays, label: t.admin.cardBookings, value: dash.data.cards.bookings, cls: 'bg-amber-100 text-amber-700' },
        { icon: Banknote, label: t.admin.cardRevenue, value: `$${dash.data.cards.revenue}`, cls: 'bg-emerald-100 text-emerald-700' },
      ]
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-sm font-bold text-primary">{t.admin.kicker}</p>
        <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">{t.admin.title}</h1>
      </motion.div>

      {dash.isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-28" />))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <span className={`flex size-10 items-center justify-center rounded-xl ${c.cls}`}>
                      <c.icon className="size-5" />
                    </span>
                    <span className="text-2xl font-extrabold" dir="ltr">{c.value}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">{c.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
          {dash.data && (
            <Card className="mt-3 flex flex-wrap items-center gap-2 p-4 text-sm">
              <span className="font-bold">{t.admin.todayPrefix} {dash.data.today.total}</span>
              <StatusBadge status="COMPLETED" />
              <span dir="ltr" className="font-bold">{dash.data.today.completed}</span>
              <StatusBadge status="PENDING" />
              <span dir="ltr" className="font-bold">{dash.data.today.pending}</span>
              <StatusBadge status="CONFIRMED" />
              <span dir="ltr" className="font-bold">{dash.data.today.confirmed}</span>
              <StatusBadge status="CANCELLED" />
              <span dir="ltr" className="font-bold">{dash.data.today.cancelled}</span>
            </Card>
          )}
        </>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" /> {t.admin.monthlyAppts}</CardTitle></CardHeader>
          <CardContent><Bars rows={monthly.data?.appointments ?? []} valueKey="count" barClass="bg-blue-500" emptyLabel={t.admin.noData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="size-5 text-primary" /> {t.admin.monthlyRevenue}</CardTitle></CardHeader>
          <CardContent><Bars rows={monthly.data?.revenue ?? []} valueKey="total" barClass="bg-emerald-500" emptyLabel={t.admin.noData} /></CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-5 text-amber-500" /> {t.admin.topDoctors}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(top.data ?? []).slice(0, 5).map((r: any, i: number) => (
            <div key={r._id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5" dir="ltr">
              <span className={`flex size-7 items-center justify-center rounded-full text-xs font-extrabold ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </span>
              <Avatar className="size-8">
                <AvatarImage src={portraitFor(r._id)} alt="" />
                <AvatarFallback className="text-[10px]">DR</AvatarFallback>
              </Avatar>
              <span className="font-mono text-xs text-muted-foreground">…{String(r._id).slice(-8)}</span>
              <span className="ms-auto text-sm font-extrabold">{r.bookings} {t.admin.bookingsSuffix}</span>
            </div>
          ))}
          {(top.data ?? []).length === 0 && <p className="py-3 text-center text-xs text-muted-foreground">{t.admin.noData}</p>}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-5 text-primary" /> {t.admin.usersTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(users.data?.items ?? []).map((u: any) => (
            <div key={u._id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-2.5" dir="ltr">
              <Avatar className="size-8">
                <AvatarImage src={u.photoUrl} alt="" />
                <AvatarFallback className="text-[10px]">{initialsOf(u.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{u.email}</p>
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <StatusBadge status={u.status} />
                  {(u.roles ?? []).map((r: any) => (
                    <Badge key={r.name ?? r} variant="secondary" className="text-[10px]">{r.name ?? r}</Badge>
                  ))}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" className={u.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'} onClick={() => suspend.mutate({ id: u._id, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}>
                  {u.status === 'ACTIVE' ? <UserX /> : <UserCheck />}
                  {u.status === 'ACTIVE' ? t.admin.suspend : t.admin.activate}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => assignRoles.mutate({ id: u._id, roles: ['DOCTOR'] })}>{t.admin.makeDoctor}</Button>
                <Button size="sm" variant="ghost" onClick={() => assignRoles.mutate({ id: u._id, roles: ['ADMIN'] })}>{t.admin.makeAdmin}</Button>
              </div>
            </div>
          ))}
          <Pager page={page} total={users.data?.total ?? 0} limit={USER_LIMIT} onChange={setPage} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> {t.admin.verifyTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(doctors.data?.items ?? []).map((d: any) => (
            <div key={d._id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 transition-colors hover:border-primary/50" dir="ltr">
              <Link href={`/${locale}/dashboard/admin/doctors/${d._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-9">
                  <AvatarImage src={portraitFor(d._id, d.photoUrl || d.userId?.photoUrl)} alt="" />
                  <AvatarFallback className="text-[10px]">{initialsOf(d.bio)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold hover:text-primary">{d.bio || d.userId?.email || 'Doctor'}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[d.userId?.email, d.userId?.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[d.specialtyId?.name, d.city, d.price != null ? `$${d.price}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
              {d.verified ? (
                <Badge variant="success" className="gap-1"><BadgeCheck className="size-3.5" /> {t.admin.verified}</Badge>
              ) : (
                <Badge variant="warning">{t.admin.unverified}</Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => verify.mutate({ id: d._id, verified: !d.verified })}>
                {d.verified ? t.admin.unverify : t.admin.verify}
              </Button>
            </div>
          ))}
          <Pager page={docPage} total={doctors.data?.total ?? 0} limit={DOC_LIMIT} onChange={setDocPage} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Stethoscope className="size-5 text-primary" /> {t.admin.specTitle}</CardTitle>
          <p className="text-xs text-muted-foreground">{t.admin.specSub}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {(specs.data ?? []).map((s: any) => (
              <Badge key={s._id} variant="secondary" dir="ltr">{s.name}</Badge>
            ))}
            {(specs.data ?? []).length === 0 && (
              <span className="text-xs text-muted-foreground">{t.admin.noData}</span>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={specName}
              onChange={(e) => setSpecName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && specName.trim() && addSpec.mutate()}
              placeholder={t.admin.specPh}
            />
            <Button disabled={!specName.trim() || addSpec.isPending} onClick={() => addSpec.mutate()} className="shrink-0">
              <Plus /> {t.admin.specAdd}
            </Button>
          </div>
          {addSpec.isSuccess && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
              <Check className="size-4" /> {t.admin.specAdded}
            </p>
          )}
          {addSpec.isError && <p className="mt-2 text-sm font-semibold text-red-600">{t.admin.specErr}</p>}
        </CardContent>
      </Card>
    </main>
  );
}

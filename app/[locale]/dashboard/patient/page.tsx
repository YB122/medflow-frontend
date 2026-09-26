'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, Bell, Star, Search, MessageCircle,
  CalendarClock, XCircle, CheckCheck, Hourglass, CircleCheck, Stethoscope,
} from 'lucide-react';
import { api } from '@/lib/store';
import { portraitFor, initialsOf } from '@/lib/doctors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { Pager } from '@/components/pager';
import { RequireRole } from '@/components/require-role';
import { useT, useLocale } from '@/components/i18n-provider';

type Appt = { _id: string; date: string; start: string; status: string; doctorId: string; reason?: string };
type Page<T> = { items: T[]; total: number; page: number; limit: number };

const APPT_LIMIT = 6;
const NOTIF_LIMIT = 10;

const NOTIF_STYLE: Record<string, { icon: any; cls: string }> = {
  BOOKED: { icon: CalendarDays, cls: 'bg-sky-100 text-sky-700' },
  APPROVED: { icon: CheckCheck, cls: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { icon: XCircle, cls: 'bg-red-100 text-red-700' },
  REMINDER: { icon: Bell, cls: 'bg-amber-100 text-amber-700' },
};

export default function PatientDashboardPage() {
  return (
    <RequireRole allow={['PATIENT', 'ADMIN', 'SUPER_ADMIN']}>
      <PatientDashboard />
    </RequireRole>
  );
}

function PatientDashboard() {
  const t = useT();
  const locale = useLocale();
  const L = (p: string) => `/${locale}${p}`;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [apptPage, setApptPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifPage, setNotifPage] = useState(1);
  const [reschedId, setReschedId] = useState<string | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate] = useState(todayStr);

  // Stats come from a wide fetch (counts only); the list itself is paginated.
  const statsQ = useQuery({
    queryKey: ['mine-stats'],
    queryFn: () => api<Page<Appt>>('/appointments/mine?limit=100'),
  });
  const statusQs = statusFilter ? `&status=${statusFilter}` : '';
  const appts = useQuery({
    queryKey: ['mine', statusFilter, apptPage],
    queryFn: () => api<Page<Appt>>(`/appointments/mine?page=${apptPage}&limit=${APPT_LIMIT}${statusQs}`),
  });
  const notifs = useQuery({
    queryKey: ['notifs', unreadOnly, notifPage],
    queryFn: () =>
      api<Page<any>>(`/notifications?${unreadOnly ? 'unread=true&' : ''}page=${notifPage}&limit=${NOTIF_LIMIT}`),
  });
  const unreadCountQ = useQuery({
    queryKey: ['notifs-unread-count'],
    queryFn: () => api<Page<any>>('/notifications?unread=true&limit=1'),
  });

  const activeAppt = appts.data?.items?.find((a) => a._id === reschedId);
  const slots = useQuery({
    queryKey: ['resched-slots', activeAppt?.doctorId, newDate],
    queryFn: () =>
      api<Array<{ start: string; end: string; available: boolean }>>(
        `/appointments/slots?doctorId=${activeAppt!.doctorId}&date=${newDate}`,
      ),
    enabled: !!activeAppt,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['mine'] });
    qc.invalidateQueries({ queryKey: ['mine-stats'] });
    qc.invalidateQueries({ queryKey: ['notifs'] });
    qc.invalidateQueries({ queryKey: ['notifs-unread-count'] });
  };
  const cancel = useMutation({
    mutationFn: (id: string) => api(`/appointments/${id}/cancel`, { method: 'PATCH' }),
    onSuccess: refresh,
  });
  const reschedule = useMutation({
    mutationFn: ({ id, start }: { id: string; start: string }) =>
      api(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ date: newDate, start }) }),
    onSuccess: () => {
      setReschedId(null);
      refresh();
    },
  });
  const markRead = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: refresh,
  });
  const markAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: refresh,
  });
  const rate = useMutation({
    mutationFn: ({ doctorId, stars }: { doctorId: string; stars: number }) =>
      api(`/doctors/${doctorId}/reviews`, { method: 'POST', body: JSON.stringify({ stars }) }),
  });

  const items = appts.data?.items ?? [];
  const all = statsQ.data?.items ?? [];
  const upcoming = all.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length;
  const done = all.filter((a) => a.status === 'COMPLETED').length;
  const unread = unreadCountQ.data?.total ?? 0;
  const notifItems = notifs.data?.items ?? [];

  const stats = [
    { icon: CalendarClock, label: t.patient.statUpcoming, value: upcoming, cls: 'bg-sky-100 text-sky-700' },
    { icon: Hourglass, label: t.patient.statPending, value: all.filter((a) => a.status === 'PENDING').length, cls: 'bg-amber-100 text-amber-700' },
    { icon: CircleCheck, label: t.patient.statDone, value: done, cls: 'bg-emerald-100 text-emerald-700' },
    { icon: Bell, label: t.patient.statUnread, value: unread, cls: 'bg-violet-100 text-violet-700' },
  ];

  const pickFilter = (v: string) => {
    setStatusFilter(v);
    setApptPage(1);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ---------- HEADER ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <p className="text-sm font-bold text-primary">{t.patient.greeting}</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">{t.patient.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={L('/doctors')}><Button><Search /> {t.patient.newBooking}</Button></Link>
          <Link href={L('/chat')}><Button variant="outline"><MessageCircle /> {t.patient.chat}</Button></Link>
        </div>
      </motion.div>

      {/* ---------- STATS ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className={`flex size-10 items-center justify-center rounded-xl ${s.cls}`}>
                  <s.icon className="size-5" />
                </span>
                <span className="text-3xl font-extrabold" dir="ltr">{statsQ.isLoading ? '–' : s.value}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ---------- TABS ---------- */}
      <Tabs defaultValue="appts" className="mt-6">
        <TabsList>
          <TabsTrigger value="appts"><CalendarDays /> {t.patient.tabAppts}</TabsTrigger>
          <TabsTrigger value="notifs">
            <Bell /> {t.patient.tabNotifs}
            {unread > 0 && <Badge variant="destructive" className="px-1.5" dir="ltr">{unread}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appts">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {t.patient.filters.map((f) => (
              <Button
                key={f.v}
                size="sm"
                variant={statusFilter === f.v ? 'default' : 'outline'}
                onClick={() => pickFilter(f.v)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {appts.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-36" />))}
            </div>
          ) : items.length === 0 ? (
            <Card className="p-10 text-center">
              <Stethoscope className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 font-extrabold">{t.patient.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.patient.emptySub}</p>
              <Link href={L('/doctors')}><Button className="mt-4">{t.patient.findDoctor}</Button></Link>
            </Card>
          ) : (
            <motion.div layout className="grid gap-3 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {items.map((a) => (
                  <motion.div
                    key={a._id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="size-12 rounded-xl">
                            <AvatarImage src={portraitFor(a.doctorId)} alt="" />
                            <AvatarFallback>{initialsOf('D')}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="flex items-center gap-1.5 text-sm font-extrabold" dir="ltr">
                                <CalendarDays className="size-4 text-primary" /> {a.date}
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="size-3.5" /> {a.start}
                                </span>
                              </p>
                              <StatusBadge status={a.status} />
                            </div>
                            <Link href={L(`/doctors/${a.doctorId}`)} className="mt-0.5 block truncate text-xs text-primary hover:underline" dir="ltr">
                              {t.patient.doctorProfile}
                            </Link>
                            {a.reason && <p className="mt-1 truncate text-xs text-muted-foreground">📝 {a.reason}</p>}
                          </div>
                        </div>

                        {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                          <div className="mt-3 flex gap-2 border-t border-border/70 pt-3">
                            <Button
                              size="sm" variant="outline" className="flex-1"
                              onClick={() => {
                                setReschedId(reschedId === a._id ? null : a._id);
                                setNewDate(a.date);
                              }}
                            >
                              <CalendarClock /> {reschedId === a._id ? t.patient.close : t.patient.reschedule}
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={cancel.isPending}
                              onClick={() => cancel.mutate(a._id)}
                            >
                              <XCircle /> {t.patient.cancel}
                            </Button>
                          </div>
                        )}
                        {a.status === 'COMPLETED' && (
                          <div className="mt-3 border-t border-border/70 pt-3">
                            <Button size="sm" variant="secondary" className="w-full" onClick={() => rate.mutate({ doctorId: a.doctorId, stars: 5 })}>
                              <Star className="fill-amber-400 text-amber-400" /> {t.patient.rateVisit}
                            </Button>
                          </div>
                        )}

                        <AnimatePresence>
                          {reschedId === a._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 rounded-lg bg-muted/60 p-3">
                                <Input type="date" value={newDate} min={todayStr} onChange={(e) => setNewDate(e.target.value)} dir="ltr" />
                                <div className="mt-2 grid grid-cols-4 gap-1.5">
                                  {slots.data?.map((s) => (
                                    <button
                                      key={s.start}
                                      disabled={!s.available || reschedule.isPending}
                                      onClick={() => reschedule.mutate({ id: a._id, start: s.start })}
                                      dir="ltr"
                                      className={`rounded-md border px-1 py-1.5 text-xs font-bold transition-all ${s.available ? 'border-blue-200 bg-card hover:bg-primary hover:text-white dark:border-blue-800' : 'bg-muted text-muted-foreground line-through'}`}
                                    >
                                      {s.start}
                                    </button>
                                  ))}
                                </div>
                                {reschedule.isError && <p className="mt-1.5 text-xs font-semibold text-red-600">{t.patient.reschedErr}</p>}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          <Pager page={apptPage} total={appts.data?.total ?? 0} limit={APPT_LIMIT} onChange={setApptPage} />
          {cancel.isError && <p className="mt-3 text-sm font-semibold text-red-600">{t.patient.cancelErr}</p>}
        </TabsContent>

        <TabsContent value="notifs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Bell className="size-5 text-primary" /> {t.patient.notifTitle}</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={unreadOnly ? 'default' : 'outline'}
                  onClick={() => {
                    setUnreadOnly((v) => !v);
                    setNotifPage(1);
                  }}
                >
                  {unreadOnly ? t.patient.showAll : t.patient.unreadOnly}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => markAll.mutate()}><CheckCheck /> {t.patient.markAll}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifItems.map((n: any) => {
                const st = NOTIF_STYLE[n.type] ?? NOTIF_STYLE.BOOKED;
                return (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${n.read ? 'border-transparent bg-muted/40' : 'border-blue-200 bg-blue-50/50'}`}
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${st.cls}`}>
                      <st.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.read ? 'text-muted-foreground' : 'font-bold'}`}>{n.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{n.body}</p>
                    </div>
                    {!n.read && (
                      <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n._id)}>✓</Button>
                    )}
                  </motion.div>
                );
              })}
              {notifItems.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{t.patient.noNotifs}</p>
              )}
              <Pager page={notifPage} total={notifs.data?.total ?? 0} limit={NOTIF_LIMIT} onChange={setNotifPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, Clock, Check, X, Plus, Trash2, Save,
  ClipboardList, Pill, CalendarClock, CircleCheck, Hourglass,
  MessageCircle, Stethoscope, ChevronRight, ChevronLeft,
  Camera, Upload, UserRound, Users, FilePlus2,
} from 'lucide-react';
import { api, uploadDoctorPhoto } from '@/lib/store';
import { portraitFor, initialsOf } from '@/lib/doctors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { Pager } from '@/components/pager';
import { RequireRole } from '@/components/require-role';
import { useT, useLocale } from '@/components/i18n-provider';

type Window = { dayOfWeek: number; start: string; end: string; slotMinutes: number };
const APPT_LIMIT = 6;

export default function DoctorDashboardPage() {
  return (
    <RequireRole allow={['DOCTOR', 'ADMIN', 'SUPER_ADMIN']}>
      <DoctorDashboard />
    </RequireRole>
  );
}

function DoctorDashboard() {
  const t = useT();
  const locale = useLocale();
  const L = (p: string) => `/${locale}${p}`;
  const Back = locale === 'ar' ? ChevronRight : ChevronLeft;
  const qc = useQueryClient();
  const [doctorId, setDoctorId] = useState('');
  const [windows, setWindows] = useState<Window[]>([
    { dayOfWeek: 1, start: '09:00', end: '13:00', slotMinutes: 30 },
    { dayOfWeek: 1, start: '15:00', end: '18:00', slotMinutes: 30 },
    { dayOfWeek: 2, start: '09:00', end: '14:00', slotMinutes: 30 },
  ]);
  const [noteForm, setNoteForm] = useState({ patientId: '', appointmentId: '', diagnosis: '', notes: '' });
  const [rxForm, setRxForm] = useState({ recordId: '', medication: '', dosage: '', instructions: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [apptStatus, setApptStatus] = useState('');
  const [apptPage, setApptPage] = useState(1);
  const [tab, setTab] = useState('requests');

  const appts = useQuery({
    queryKey: ['mine', apptStatus, apptPage],
    queryFn: () =>
      api<{ items: any[]; total: number }>(
        `/appointments/mine?page=${apptPage}&limit=${APPT_LIMIT}${apptStatus ? `&status=${apptStatus}` : ''}`,
      ),
  });
  // Counts for the stat cards (wide fetch; the list above stays paginated).
  const statsQ = useQuery({
    queryKey: ['mine-stats'],
    queryFn: () => api<{ items: any[] }>('/appointments/mine?limit=100'),
  });
  const docProfile = useQuery({
    queryKey: ['doc-profile', doctorId],
    queryFn: () => api<any>(`/doctors/${doctorId}`),
    enabled: !!doctorId,
  });
  // Resolve the logged-in doctor's own profile so schedule/photo/notes just work.
  const myProfile = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => api<any>('/doctors/me'),
  });
  useEffect(() => {
    const id = myProfile.data?._id;
    if (id) setDoctorId((cur) => cur || id);
  }, [myProfile.data]);
  const sched = useQuery({
    queryKey: ['sched', doctorId],
    queryFn: () => api<Window[]>(`/doctors/${doctorId}/schedule`),
    enabled: !!doctorId,
  });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' | 'complete' }) =>
      api(`/appointments/${id}/${action}`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mine'] });
      qc.invalidateQueries({ queryKey: ['mine-stats'] });
      qc.invalidateQueries({ queryKey: ['my-patients'] });
    },
  });
  const patientsQ = useQuery({
    queryKey: ['my-patients'],
    queryFn: () => api<any[]>('/doctors/me/patients'),
  });

  /** Jump to the records tab with the patient prefilled for a new note. */
  const addNoteFor = (patientId: string) => {
    setNoteForm((f) => ({ ...f, patientId, appointmentId: '', diagnosis: '', notes: '' }));
    setTab('records');
  };
  const saveSchedule = useMutation({
    mutationFn: () =>
      api(`/doctors/${doctorId}/schedule`, { method: 'POST', body: JSON.stringify({ windows }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sched'] }),
  });
  const saveNote = useMutation({
    mutationFn: () =>
      api('/records', { method: 'POST', body: JSON.stringify({ ...noteForm, doctorId: doctorId || undefined }) }),
    onSuccess: () => setNoteForm({ patientId: '', appointmentId: '', diagnosis: '', notes: '' }),
  });
  const saveRx = useMutation({
    mutationFn: () =>
      api(`/records/${rxForm.recordId}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify({ medication: rxForm.medication, dosage: rxForm.dosage, instructions: rxForm.instructions }),
      }),
    onSuccess: () => setRxForm({ recordId: '', medication: '', dosage: '', instructions: '' }),
  });
  const uploadPhoto = useMutation({
    mutationFn: () => uploadDoctorPhoto(doctorId, photoFile!),
    onSuccess: () => {
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoError('');
      qc.invalidateQueries({ queryKey: ['doc-profile', doctorId] });
    },
    onError: () => setPhotoError(t.doctor.photoErr),
  });

  const pickPhoto = (f: File | undefined) => {
    setPhotoError('');
    if (!f) return;
    if (!f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) {
      setPhotoError(t.doctor.photoErr);
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const all = statsQ.data?.items ?? [];
  const pending = all.filter((a: any) => a.status === 'PENDING');
  const confirmed = all.filter((a: any) => a.status === 'CONFIRMED');
  const completed = all.filter((a: any) => a.status === 'COMPLETED');
  const listItems = appts.data?.items ?? [];

  const stats = [
    { icon: Hourglass, label: t.doctor.statPending, value: pending.length, cls: 'bg-amber-100 text-amber-700' },
    { icon: CalendarClock, label: t.doctor.statConfirmed, value: confirmed.length, cls: 'bg-sky-100 text-sky-700' },
    { icon: CircleCheck, label: t.doctor.statDone, value: completed.length, cls: 'bg-emerald-100 text-emerald-700' },
    { icon: CalendarDays, label: t.doctor.statTotal, value: all.length, cls: 'bg-violet-100 text-violet-700' },
  ];

  const patchWindow = (i: number, k: keyof Window, v: string | number) =>
    setWindows((w) => w.map((x, j) => (j === i ? { ...x, [k]: k === 'dayOfWeek' || k === 'slotMinutes' ? Number(v) : v } : x)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ---------- HERO STRIP ---------- */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image src="/images/care-team.jpg" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-blue-950/90 via-blue-950/70 to-blue-950/30" />
          </div>
          <CardContent className="relative flex flex-wrap items-center justify-between gap-4 p-6 text-white sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Stethoscope className="size-7" />
              </span>
              <div>
                <p className="text-sm text-blue-100/80">{t.doctor.greeting}</p>
                <h1 className="mt-0.5 text-2xl font-extrabold sm:text-3xl">{t.doctor.title}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              {pending.length > 0 && (
                <Badge className="bg-amber-400 px-3 py-1.5 text-amber-950 hover:bg-amber-300" dir="ltr">
                  {pending.length} {t.doctor.pendingBadgeSuffix}
                </Badge>
              )}
              <Link href={L('/chat')}><Button className="bg-white text-blue-900 hover:bg-blue-50"><MessageCircle /> {t.doctor.chat}</Button></Link>
              <Link href={L('/profile')}><Button className="bg-white/15 text-white hover:bg-white/25 hover:text-white"><UserRound /> {t.nav.profile}</Button></Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------- STATS ---------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      {/* ---------- PROFILE PHOTO ---------- */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="mt-5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <Avatar className="size-20 rounded-2xl border-2 border-border shadow-sm">
              <AvatarImage src={photoPreview ?? portraitFor(doctorId || undefined, docProfile.data?.photoUrl)} alt="" />
              <AvatarFallback><Camera className="size-6 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-extrabold">
                <Camera className="size-4 text-primary" /> {t.doctor.photoTitle}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.doctor.photoSub}</p>
              {!doctorId ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">{t.doctor.photoNeedId}</p>
              ) : (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => pickPhoto(e.target.files?.[0])}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer"><Camera /> {t.doctor.photoPick}</span>
                    </Button>
                  </label>
                  <Button
                    size="sm"
                    disabled={!photoFile || uploadPhoto.isPending}
                    onClick={() => uploadPhoto.mutate()}
                  >
                    <Upload /> {uploadPhoto.isPending ? '…' : t.doctor.photoUpload}
                  </Button>
                  {photoFile && (
                    <span className="max-w-48 truncate text-xs text-muted-foreground" dir="ltr">
                      {photoFile.name}
                    </span>
                  )}
                </div>
              )}
              {uploadPhoto.isSuccess && <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Check className="size-4" /> {t.doctor.photoOk}</p>}
              {photoError && <p className="mt-1.5 text-sm font-semibold text-red-600">{photoError}</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="requests">
            <Hourglass /> {t.doctor.tabRequests}
            {pending.length > 0 && <Badge variant="destructive" className="px-1.5" dir="ltr">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="patients"><Users /> {t.doctor.tabPatients}</TabsTrigger>
          <TabsTrigger value="schedule"><CalendarClock /> {t.doctor.tabSchedule}</TabsTrigger>
          <TabsTrigger value="records"><ClipboardList /> {t.doctor.tabRecords}</TabsTrigger>
        </TabsList>

        {/* ---------- REQUESTS ---------- */}
        <TabsContent value="requests">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {t.patient.filters.map((f) => (
              <Button
                key={f.v}
                size="sm"
                variant={apptStatus === f.v ? 'default' : 'outline'}
                onClick={() => {
                  setApptStatus(f.v);
                  setApptPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
          {appts.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-32" />))}</div>
          ) : listItems.length === 0 ? (
            <Card className="p-10 text-center">
              <CalendarDays className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 font-extrabold">{t.doctor.noApptsTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.doctor.noApptsSub}</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {listItems.map((a: any) => (
                  <motion.div
                    key={a._id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className={`overflow-hidden ${a.status === 'PENDING' ? 'border-amber-300 ring-1 ring-amber-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="size-11 rounded-xl">
                            <AvatarImage src={portraitFor(a.patientId)} alt="" />
                            <AvatarFallback>P</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="flex items-center gap-1.5 text-sm font-extrabold" dir="ltr">
                                {a.date} · {a.start}
                              </p>
                              <StatusBadge status={a.status} />
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
                              patient {String(a.patientId).slice(0, 10)}…
                            </p>
                            {a.reason && <p className="mt-1 truncate text-xs">📝 {a.reason}</p>}
                          </div>
                        </div>
                        {a.status === 'PENDING' && (
                          <div className="mt-3 flex gap-2 border-t border-border/70 pt-3">
                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={decide.isPending} onClick={() => decide.mutate({ id: a._id, action: 'approve' })}>
                              <Check /> {t.doctor.accept}
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700" disabled={decide.isPending} onClick={() => decide.mutate({ id: a._id, action: 'reject' })}>
                              <X /> {t.doctor.reject}
                            </Button>
                          </div>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <div className="mt-3 border-t border-border/70 pt-3">
                            <Button size="sm" className="w-full" disabled={decide.isPending} onClick={() => decide.mutate({ id: a._id, action: 'complete' })}>
                              <CircleCheck /> {t.doctor.completeVisit}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <Pager page={apptPage} total={appts.data?.total ?? 0} limit={APPT_LIMIT} onChange={setApptPage} />
          {decide.isError && <p className="mt-3 text-sm font-semibold text-red-600">{t.doctor.actionErr}</p>}
        </TabsContent>

        {/* ---------- PATIENTS ---------- */}
        <TabsContent value="patients">
          {patientsQ.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-28" />))}</div>
          ) : (patientsQ.data ?? []).length === 0 ? (
            <Card className="p-10 text-center">
              <Users className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 font-extrabold">{t.doctor.noPatients}</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(patientsQ.data ?? []).map((p: any) => (
                <motion.div
                  key={p.patientId}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11 rounded-xl">
                          <AvatarFallback>{initialsOf(p.email ?? p.phone)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold" dir="ltr">
                            {p.email ?? p.phone ?? p.patientId}
                          </p>
                          {p.email && p.phone && (
                            <p className="truncate text-xs text-muted-foreground" dir="ltr">{p.phone}</p>
                          )}
                          <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                            <Badge variant="secondary" dir="ltr">{p.total} {t.doctor.pVisits}</Badge>
                            {p.upcoming > 0 && <Badge variant="info" dir="ltr">{p.upcoming} {t.doctor.pUpcoming}</Badge>}
                            {p.completed > 0 && <Badge variant="success" dir="ltr">{p.completed} {t.doctor.pDone}</Badge>}
                          </p>
                          {p.lastVisit && (
                            <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">
                              {t.doctor.pLastVisit}: {p.lastVisit}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 border-t border-border/70 pt-3">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => addNoteFor(p.patientId)}>
                          <FilePlus2 /> {t.doctor.pAddNote}
                        </Button>
                        <Link href={L('/chat')} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full">
                            <MessageCircle /> {t.doctor.pChat}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------- SCHEDULE ---------- */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="size-5 text-primary" /> {t.doctor.schedTitle}</CardTitle>
              <CardDescription>{t.doctor.schedSub}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  placeholder={t.doctor.profileIdPh}
                  dir="ltr"
                  className="font-mono text-xs"
                />
                {doctorId && (
                  <Link href={L(`/doctors/${doctorId}`)}>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">{t.doctor.previewMine} <Back className="size-4" /></Button>
                  </Link>
                )}
              </div>
              {sched.data && (
                <p className="mt-3 rounded-lg bg-muted/60 p-2.5 text-xs leading-6" dir="ltr">
                  {t.doctor.currentPrefix} {sched.data.map((w) => `${t.days[w.dayOfWeek]} ${w.start}-${w.end}`).join(' · ') || '—'}
                </p>
              )}
              <div className="mt-4 space-y-2">
                <AnimatePresence initial={false}>
                  {windows.map((w, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card p-2.5"
                      dir="ltr"
                    >
                      <select value={w.dayOfWeek} onChange={(e) => patchWindow(i, 'dayOfWeek', e.target.value)} className="h-9 rounded-md border border-input bg-card px-2 text-sm">
                        {t.days.map((d, n) => (<option key={n} value={n}>{d}</option>))}
                      </select>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Clock className="size-4 text-muted-foreground" />
                        <Input type="time" value={w.start} onChange={(e) => patchWindow(i, 'start', e.target.value)} className="h-9 w-32" />
                        <span className="text-muted-foreground">→</span>
                        <Input type="time" value={w.end} onChange={(e) => patchWindow(i, 'end', e.target.value)} className="h-9 w-32" />
                      </span>
                      <select value={w.slotMinutes} onChange={(e) => patchWindow(i, 'slotMinutes', e.target.value)} className="h-9 rounded-md border border-input bg-card px-2 text-sm">
                        {[15, 20, 30, 45, 60].map((m) => (<option key={m} value={m}>{m} {t.doctor.winUnit}</option>))}
                      </select>
                      <Button variant="ghost" size="icon" className="ms-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setWindows((x) => x.filter((_, j) => j !== i))}>
                        <Trash2 />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setWindows((w) => [...w, { dayOfWeek: 1, start: '09:00', end: '12:00', slotMinutes: 30 }])}>
                  <Plus /> {t.doctor.addWindow}
                </Button>
                <Button disabled={!doctorId || saveSchedule.isPending} onClick={() => saveSchedule.mutate()}>
                  <Save /> {t.doctor.saveSchedule}
                </Button>
              </div>
              {saveSchedule.isSuccess && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Check className="size-4" /> {t.doctor.savedOk}</p>}
              {saveSchedule.isError && <p className="mt-2 text-sm font-semibold text-red-600">{t.doctor.saveErr}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- RECORDS ---------- */}
        <TabsContent value="records">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="size-5 text-primary" /> {t.doctor.noteTitle}</CardTitle>
                <CardDescription>{t.doctor.noteSub}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5" dir="ltr">
                <Input value={noteForm.patientId} onChange={(e) => setNoteForm({ ...noteForm, patientId: e.target.value })} placeholder={t.doctor.patientIdPh} className="font-mono text-xs" />
                <Input value={noteForm.appointmentId} onChange={(e) => setNoteForm({ ...noteForm, appointmentId: e.target.value })} placeholder={t.doctor.apptIdPh} className="font-mono text-xs" />
                <Input value={noteForm.diagnosis} onChange={(e) => setNoteForm({ ...noteForm, diagnosis: e.target.value })} placeholder={t.doctor.diagnosisPh} />
                <Textarea value={noteForm.notes} onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })} placeholder={t.doctor.notesPh} />
                <Button onClick={() => saveNote.mutate()} disabled={saveNote.isPending} className="w-full"><Save /> {t.doctor.saveNote}</Button>
                {saveNote.isSuccess && <p className="text-sm font-semibold text-emerald-700">{t.doctor.noteSaved}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Pill className="size-5 text-primary" /> {t.doctor.rxTitle}</CardTitle>
                <CardDescription>{t.doctor.rxSub}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5" dir="ltr">
                <Input value={rxForm.recordId} onChange={(e) => setRxForm({ ...rxForm, recordId: e.target.value })} placeholder={t.doctor.recordIdPh} className="font-mono text-xs" />
                <Input value={rxForm.medication} onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })} placeholder={t.doctor.medPh} />
                <div className="grid grid-cols-2 gap-2.5">
                  <Input value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} placeholder={t.doctor.dosagePh} />
                  <Input value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} placeholder={t.doctor.instrPh} />
                </div>
                <Button onClick={() => saveRx.mutate()} disabled={saveRx.isPending} className="w-full"><Pill /> {t.doctor.saveRx}</Button>
                {saveRx.isSuccess && <p className="text-sm font-semibold text-emerald-700">{t.doctor.rxSaved}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

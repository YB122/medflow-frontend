'use client';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Star, BadgeCheck, CalendarDays, Clock, Wallet,
  CheckCircle2, XCircle, Send, MessageSquareHeart, ClipboardList,
} from 'lucide-react';
import { api, useAuth } from '@/lib/store';
import { portraitFor, initialsOf } from '@/lib/doctors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/components/i18n-provider';

export default function DoctorProfile({ params }: { params: { locale: string; id: string } }) {
  const t = useT();
  const { id } = params;
  const qc = useQueryClient();
  const roles = useAuth((s) => s.roles);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState('');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const profile = useQuery({ queryKey: ['doctor', id], queryFn: () => api<any>(`/doctors/${id}`) });
  const slots = useQuery({
    queryKey: ['slots', id, date],
    queryFn: () => api<Array<{ start: string; end: string; available: boolean }>>(
      `/appointments/slots?doctorId=${id}&date=${date}`,
    ),
  });
  const book = useMutation({
    mutationFn: (start: string) =>
      api('/appointments', { method: 'POST', body: JSON.stringify({ doctorId: id, date, start, reason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots'] }),
  });
  const rate = useMutation({
    mutationFn: () =>
      api(`/doctors/${id}/reviews`, { method: 'POST', body: JSON.stringify({ stars, comment }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      setComment('');
    },
  });

  const d = profile.data;
  const freeCount = slots.data?.filter((s) => s.available).length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ---------- HEADER ---------- */}
      {profile.isLoading ? (
        <Card className="overflow-hidden">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="flex gap-4 p-6">
            <Skeleton className="size-24 rounded-2xl" />
            <div className="flex-1 space-y-2"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/2" /></div>
          </div>
        </Card>
      ) : d ? (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="overflow-hidden">
            <div className="relative h-44 sm:h-52">
              <Image src="/images/clinic.jpg" alt="" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-blue-950/20 to-transparent" />
              <div className="absolute bottom-3 end-4 flex gap-2">
                {d.verified && (
                  <Badge className="gap-1 bg-white/95 text-blue-800 hover:bg-white"><BadgeCheck className="size-3.5" /> {t.profile.verifiedDoctor}</Badge>
                )}
                <Badge variant="secondary" className="bg-white/95" dir="ltr">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {d.ratingAvg?.toFixed?.(1) ?? '—'} ({d.ratingCount ?? 0})
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <Avatar className="size-24 -mt-16 rounded-2xl border-4 border-white shadow-lg sm:-mt-20 sm:size-28">
                <AvatarImage src={portraitFor(id, d?.photoUrl)} alt={d.bio} />
                <AvatarFallback className="text-xl">{initialsOf(d.bio)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold tracking-tight">{d.bio || 'Doctor'}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="size-4" /> {d.city || '—'}</span>
                  <span className="flex items-center gap-1 font-bold text-primary" dir="ltr">
                    <Wallet className="size-4" /> ${d.price ?? '—'} {t.common.perVisit}
                  </span>
                  {d.specialtyId?.name && <Badge variant="secondary">{d.specialtyId.name}</Badge>}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        {/* ---------- BOOKING ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-3"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" /> {t.profile.bookTitle}
              </CardTitle>
              <CardDescription>
                {slots.data ? (
                  <span><b className="text-primary">{freeCount}</b> {t.profile.bookSubChosen}</span>
                ) : t.profile.bookSubDefault}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className="sm:w-48" dir="ltr" />
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.profile.reasonPh} />
              </div>
              {slots.isLoading ? (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-11" />))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {slots.data?.map((s) => (
                      <motion.button
                        key={s.start}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileTap={s.available ? { scale: 0.94 } : undefined}
                        disabled={!s.available || book.isPending}
                        onClick={() => book.mutate(s.start)}
                        dir="ltr"
                        className={
                          s.available
                            ? 'flex h-11 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-sm font-bold text-blue-900 transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-md hover:shadow-blue-900/20 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100'
                            : 'flex h-11 cursor-not-allowed items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground line-through'
                        }
                      >
                        <Clock className="size-3.5 opacity-70" />{s.start}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <AnimatePresence>
                {book.isSuccess && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-center gap-2 overflow-hidden rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
                  >
                    <CheckCircle2 className="size-4 shrink-0" /> {t.profile.bookedOk}
                  </motion.p>
                )}
                {book.isError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-center gap-2 overflow-hidden rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700"
                  >
                    <XCircle className="size-4 shrink-0" /> {t.profile.bookedErr}
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* ---------- SCHEDULE ---------- */}
          {d?.schedules?.length > 0 && (
            <Card className="mt-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="size-5 text-primary" /> {t.profile.weeklySchedule}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {d.schedules.map((w: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm" dir="ltr">
                      <span className="font-bold">{t.days[w.dayOfWeek] ?? `Day ${w.dayOfWeek}`}</span>
                      <span className="text-muted-foreground">{w.start} – {w.end}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ---------- RATING + REVIEWS ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="space-y-5 lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareHeart className="size-5 text-primary" /> {t.profile.rateTitle}
              </CardTitle>
              <CardDescription>{t.profile.rateSub}</CardDescription>
            </CardHeader>
            <CardContent>
              {!roles.includes('PATIENT') && (
                <p className="mb-3 rounded-lg bg-amber-50 p-2.5 text-xs leading-5 text-amber-800">{t.profile.loginToRate}</p>
              )}
              <div className="flex gap-1.5" dir="ltr">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setStars(n)}
                    className={`flex size-10 items-center justify-center rounded-lg border transition-all ${stars >= n ? 'border-amber-300 bg-amber-50' : 'border-border bg-card opacity-60 hover:opacity-100'}`}
                    aria-label={`${n} stars`}
                  >
                    <Star className={`size-5 ${stars >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </motion.button>
                ))}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.profile.commentPh} className="mt-3" dir="ltr" />
              <Button onClick={() => rate.mutate()} disabled={rate.isPending} className="mt-3 w-full">
                <Send /> {t.profile.sendRating}
              </Button>
              {rate.isSuccess && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> {t.profile.ratedOk}</p>}
              {rate.isError && <p className="mt-2 text-sm font-semibold text-red-600">{t.profile.ratedErr}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.profile.reviewsTitle} ({d?.reviews?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-auto">
              {(d?.reviews ?? []).map((r: any) => (
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
              {(d?.reviews ?? []).length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">{t.profile.noReviews}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

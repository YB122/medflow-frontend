'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Wallet, Star, BadgeCheck, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/store';
import { portraitFor, initialsOf, specName } from '@/lib/doctors';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Pager } from '@/components/pager';
import { useT, useLocale } from '@/components/i18n-provider';

export default function DoctorsPage() {
  const t = useT();
  const locale = useLocale();
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 9;
  // Any filter change restarts from page 1.
  useEffect(() => {
    setPage(1);
  }, [city, maxPrice, specialtyId, q]);
  const qs = new URLSearchParams();
  if (city) qs.set('city', city);
  if (maxPrice) qs.set('maxPrice', maxPrice);
  if (specialtyId) qs.set('specialtyId', specialtyId);
  if (q) qs.set('q', q);
  const { data, isLoading, error } = useQuery({
    queryKey: ['doctors', city, maxPrice, specialtyId, q, page],
    queryFn: () => api<{ items: any[]; total: number }>(`/doctors?${qs.toString()}&page=${page}&limit=${LIMIT}`),
  });
  const specs = useQuery({ queryKey: ['specialties'], queryFn: () => api<any[]>('/specialties') });
  const hasFilter = city || maxPrice || specialtyId || q;
  const clearAll = () => {
    setCity('');
    setMaxPrice('');
    setSpecialtyId('');
    setQ('');
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-sm font-bold text-primary">{t.doctors.kicker}</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">{t.doctors.title}</h1>
          <p className="text-sm text-muted-foreground" dir="ltr">
            {data ? `${data.total ?? data.items.length} ${t.doctors.countSuffix}` : '…'}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <Card className="mt-6 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="size-4 text-primary" /> {t.doctors.filters}
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="ms-auto">
                <X /> {t.doctors.clearAll}
              </Button>
            )}
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.doctors.searchPh} className="ps-9" />
            </div>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            >
              <option value="">{t.doctors.allSpecs}</option>
              {(specs.data ?? []).map((s: any) => (
                <option key={s._id} value={s._id}>{specName(s, locale)}</option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.doctors.cityPh} className="ps-9" />
            </div>
            <div className="relative">
              <Wallet className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t.doctors.maxPricePh} className="ps-9" dir="ltr" inputMode="numeric" />
            </div>
          </div>
        </Card>
      </motion.div>

      {isLoading && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-2 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50/60 p-6 text-center text-sm text-red-700">
          {t.common.backendDown}
        </Card>
      )}

      {data && data.items.length === 0 && (
        <Card className="mx-auto mt-6 max-w-md overflow-hidden text-center">
          <div className="relative h-44">
            <Image src="/images/care-team.jpg" alt="" fill className="object-cover" />
          </div>
          <div className="p-6">
            <p className="font-extrabold">{t.doctors.noResultsTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.doctors.noResultsSub}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>{t.doctors.clearFilters}</Button>
          </div>
        </Card>
      )}

      <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items?.map((d: any, i: number) => (
          <motion.div
            key={d._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4) }}
          >
            <Link href={`/${locale}/doctors/${d._id}`}>
              <Card className="group overflow-hidden transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/10">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={portraitFor(d._id, d.photoUrl)}
                    alt={d.bio || 'Doctor'}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent" />
                  {d.verified && (
                    <Badge className="absolute start-3 top-3 gap-1 bg-white/95 text-blue-800 hover:bg-white">
                      <BadgeCheck className="size-3.5" /> {t.doctors.verified}
                    </Badge>
                  )}
                  <span className="absolute bottom-3 start-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur" dir="ltr">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {d.ratingAvg?.toFixed?.(1) ?? '—'}
                    <span className="font-normal text-white/70">({d.ratingCount ?? 0})</span>
                  </span>
                </div>
                <div className="flex items-start gap-3 p-4">
                  <Avatar className="size-11 -mt-9 border-[3px] border-white shadow-md">
                    <AvatarImage src={portraitFor(d._id, d.photoUrl)} alt="" />
                    <AvatarFallback>{initialsOf(d.bio)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate font-extrabold leading-6">{d.bio || 'Doctor'}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {d.city || '—'}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-primary" dir="ltr">
                        ${d.price ?? '—'} <span className="text-xs font-normal text-muted-foreground">{t.common.perVisit}</span>
                      </span>
                      <Button size="sm" variant="secondary" className="transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        {t.doctors.book}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <Pager
        page={page}
        total={data?.total ?? 0}
        limit={LIMIT}
        onChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </main>
  );
}

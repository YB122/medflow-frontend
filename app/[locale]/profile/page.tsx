'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserRound, Save, Check, Camera, Upload, MapPin, LocateFixed,
  Stethoscope, Wallet, Building2, CalendarDays,
} from 'lucide-react';
import { api, useAuth, uploadDoctorPhoto } from '@/lib/store';
import { portraitFor, initialsOf } from '@/lib/doctors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { RequireRole } from '@/components/require-role';
import { useT } from '@/components/i18n-provider';

// Leaflet touches `window` — never render on the server.
const LocationPicker = dynamic(
  () => import('@/components/location-picker').then((m) => m.LocationPicker),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

type DocForm = {
  bio: string;
  city: string;
  price: string;
  specialtyId: string;
  lat: number | null;
  lng: number | null;
};

export default function ProfilePage() {
  return (
    <RequireRole allow={['PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'STAFF']}>
      <Profile />
    </RequireRole>
  );
}

function Profile() {
  const t = useT();
  const qc = useQueryClient();
  const roles = useAuth((s) => s.roles);
  const isDoctor = roles.includes('DOCTOR');

  const meQ = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ id: string; email: string | null; phone: string | null; roles: string[] }>('/auth/me'),
  });
  const myDocQ = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => api<any>('/doctors/me'),
    enabled: isDoctor,
  });
  const specsQ = useQuery({
    queryKey: ['specialties'],
    queryFn: () => api<any[]>('/specialties'),
    enabled: isDoctor,
  });
  const recentQ = useQuery({
    queryKey: ['my-recent-visits'],
    queryFn: () => api<{ items: any[] }>('/appointments/mine?limit=5'),
    enabled: isDoctor,
  });

  // ---------- account form ----------
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => {
    if (meQ.data && phone === null) setPhone(meQ.data.phone ?? '');
  }, [meQ.data, phone]);
  const savePhone = useMutation({
    mutationFn: () => api('/users/me', { method: 'PATCH', body: JSON.stringify({ phone }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  // ---------- doctor form ----------
  const [docForm, setDocForm] = useState<DocForm | null>(null);
  useEffect(() => {
    if (myDocQ.data && !docForm) {
      const d = myDocQ.data;
      setDocForm({
        bio: d.bio ?? '',
        city: d.city ?? '',
        price: d.price != null ? String(d.price) : '',
        specialtyId: typeof d.specialtyId === 'object' ? d.specialtyId?._id ?? '' : (d.specialtyId ?? ''),
        lat: d.lat ?? null,
        lng: d.lng ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myDocQ.data]);
  const saveDoctor = useMutation({
    mutationFn: () =>
      api(`/doctors/${myDocQ.data._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          bio: docForm!.bio,
          city: docForm!.city,
          price: Math.max(0, Number(docForm!.price) || 0),
          specialtyId: docForm!.specialtyId || undefined,
          lat: docForm!.lat,
          lng: docForm!.lng,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-doctor-profile'] }),
  });

  // ---------- doctor photo ----------
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const uploadPhoto = useMutation({
    mutationFn: () => uploadDoctorPhoto(myDocQ.data._id, photoFile!),
    onSuccess: () => {
      setPhotoFile(null);
      setPhotoPreview(null);
      qc.invalidateQueries({ queryKey: ['my-doctor-profile'] });
    },
  });
  const pickPhoto = (f: File | undefined) => {
    if (!f || !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation || !docForm) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setDocForm({
        ...docForm,
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
      });
    });
  };

  const profileId = myDocQ.data?._id as string | undefined;
  const avatarSrc = photoPreview ?? portraitFor(profileId, myDocQ.data?.photoUrl);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-sm font-bold text-primary">{t.account.subtitle}</p>
        <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">{t.account.title}</h1>
      </motion.div>

      {/* ---------- identity header ---------- */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
        <Card className="mt-6">
          <CardContent className="flex items-center gap-4 p-5">
            {meQ.isLoading ? (
              <Skeleton className="size-16 rounded-2xl" />
            ) : (
              <Avatar className="size-16 rounded-2xl">
                <AvatarImage src={avatarSrc} alt="" />
                <AvatarFallback className="text-lg">{initialsOf(meQ.data?.email)}</AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <p className="truncate font-extrabold" dir="ltr">{meQ.data?.email ?? meQ.data?.phone ?? '…'}</p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {(meQ.data?.roles ?? roles).map((r: string) => (
                  <Badge key={r} variant="secondary" dir="ltr">{r}</Badge>
                ))}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------- account ---------- */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" /> {t.account.accountTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">{t.account.emailLabel}</label>
              <Input value={meQ.data?.email ?? ''} disabled dir="ltr" placeholder="—" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">{t.account.phoneLabel}</label>
              <div className="flex gap-2">
                <Input
                  value={phone ?? ''}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.auth.phonePh}
                  dir="ltr"
                  inputMode="tel"
                />
                <Button onClick={() => savePhone.mutate()} disabled={savePhone.isPending} className="shrink-0">
                  <Save /> {t.account.save}
                </Button>
              </div>
            </div>
          </CardContent>
          {savePhone.isSuccess && (
            <p className="flex items-center gap-1.5 px-6 pb-4 text-sm font-semibold text-emerald-700">
              <Check className="size-4" /> {t.account.savedOk}
            </p>
          )}
          {savePhone.isError && (
            <p className="px-6 pb-4 text-sm font-semibold text-red-600">{t.account.saveErr}</p>
          )}
        </Card>
      </motion.div>

      {/* ---------- doctor section ---------- */}
      {isDoctor && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope className="size-5 text-primary" /> {t.account.doctorTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {myDocQ.isLoading ? (
                <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-40" /></div>
              ) : !myDocQ.data ? (
                <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">{t.account.noProfile}</p>
              ) : (
                <>
                  {/* photo row */}
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <Avatar className="size-14 rounded-xl">
                      <AvatarImage src={avatarSrc} alt="" />
                      <AvatarFallback><Camera className="size-5 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <label>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                        <Button variant="outline" size="sm" asChild>
                          <span className="cursor-pointer"><Camera /> {t.doctor.photoPick}</span>
                        </Button>
                      </label>
                      <Button size="sm" disabled={!photoFile || uploadPhoto.isPending} onClick={() => uploadPhoto.mutate()}>
                        <Upload /> {t.doctor.photoUpload}
                      </Button>
                      {uploadPhoto.isSuccess && <span className="text-xs font-bold text-emerald-700">{t.doctor.photoOk}</span>}
                      {uploadPhoto.isError && <span className="text-xs font-bold text-red-600">{t.doctor.photoErr}</span>}
                    </div>
                  </div>

                  {docForm && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">{t.account.bioLabel}</label>
                        <Input
                          value={docForm.bio}
                          onChange={(e) => setDocForm({ ...docForm, bio: e.target.value })}
                          placeholder={t.account.bioPh}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">{t.account.specialtyLabel}</label>
                        <select
                          value={docForm.specialtyId}
                          onChange={(e) => setDocForm({ ...docForm, specialtyId: e.target.value })}
                          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          dir="ltr"
                        >
                          <option value="">{t.account.noSpecialty}</option>
                          {(specsQ.data ?? []).map((s: any) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">{t.account.priceLabel}</label>
                        <div className="relative">
                          <Wallet className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={docForm.price}
                            onChange={(e) => setDocForm({ ...docForm, price: e.target.value })}
                            inputMode="numeric"
                            dir="ltr"
                            className="ps-9"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">{t.account.cityLabel}</label>
                        <div className="relative">
                          <Building2 className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={docForm.city}
                            onChange={(e) => setDocForm({ ...docForm, city: e.target.value })}
                            className="ps-9"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="mb-1 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <MapPin className="size-4 text-primary" /> {t.account.locationTitle}
                          </label>
                          <Button size="sm" variant="ghost" onClick={useMyLocation}>
                            <LocateFixed /> {t.account.useMyLocation}
                          </Button>
                        </div>
                        <LocationPicker
                          lat={docForm.lat}
                          lng={docForm.lng}
                          onChange={(lat, lng) => setDocForm({ ...docForm, lat, lng })}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {t.account.locationHint}
                          {docForm.lat != null && docForm.lng != null && (
                            <span className="font-mono font-bold text-foreground" dir="ltr"> · {docForm.lat}, {docForm.lng}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button onClick={() => saveDoctor.mutate()} disabled={!docForm || saveDoctor.isPending} className="mt-4 w-full">
                    <Save /> {t.account.save}
                  </Button>
                  {saveDoctor.isSuccess && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                      <Check className="size-4" /> {t.account.savedOk}
                    </p>
                  )}
                  {saveDoctor.isError && (
                    <p className="mt-2 text-sm font-semibold text-red-600">{t.account.saveErr}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* recent visit history (read-only) */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" /> {t.account.historyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentQ.isLoading ? (
                <Skeleton className="h-16" />
              ) : (recentQ.data?.items ?? []).length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">{t.account.noHistory}</p>
              ) : (
                (recentQ.data?.items ?? []).map((a: any) => (
                  <div key={a._id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm" dir="ltr">
                    <span className="font-bold">{a.date} · {a.start}</span>
                    <StatusBadge status={a.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </main>
  );
}

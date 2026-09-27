/** Local doctor portrait pool (downloaded Unsplash photos in public/images). */
export const DOCTOR_PORTRAITS = [
  '/images/doctor-1.jpg',
  '/images/doctor-2.jpg',
  '/images/doctor-3.jpg',
  '/images/doctor-4.jpg',
];

/** Deterministically pick a portrait for a doctor id (stable across renders). */
export function portraitFor(id: string | undefined | null, photoUrl?: string | null): string {
  if (photoUrl) return photoUrl;
  if (!id) return DOCTOR_PORTRAITS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return DOCTOR_PORTRAITS[h % DOCTOR_PORTRAITS.length];
}

export function initialsOf(name: string | undefined | null): string {
  if (!name) return 'DR';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join('').toUpperCase();
}

/** Localized specialty name (Arabic when available, English fallback). */
export function specName(s: any, locale: string): string {
  if (!s) return '';
  if (typeof s === 'string') return s;
  if (locale === 'ar' && s.nameAr) return s.nameAr;
  return s.name ?? '';
}

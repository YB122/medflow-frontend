'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const CAIRO: [number, number] = [30.0444, 31.2357];

/** Blue location dot (avoids leaflet's default image assets that break under bundlers). */
function dotIcon(L: any) {
  return L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;border-radius:9999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 2px 8px rgba(29,78,216,.5)"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/**
 * Click-to-pick OpenStreetMap location. Leaflet loads lazily on the client
 * (no SSR), so this is safe to `dynamic()` with `ssr: false`.
 */
export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current).setView(lat != null && lng != null ? [lat, lng] : CAIRO, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      const place = (la: number, ln: number) => {
        if (markerRef.current) markerRef.current.setLatLng([la, ln]);
        else markerRef.current = L.marker([la, ln], { icon: dotIcon(L) }).addTo(map);
      };
      if (lat != null && lng != null) place(lat, lng);
      map.on('click', (e: any) => {
        const la = Number(e.latlng.lat.toFixed(6));
        const ln = Number(e.latlng.lng.toFixed(6));
        place(la, ln);
        cbRef.current(la, ln);
      });
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External updates (geolocate button / loaded profile) move map + marker.
  useEffect(() => {
    (async () => {
      if (!mapRef.current || lat == null || lng == null) return;
      const L = (await import('leaflet')).default;
      mapRef.current.setView([lat, lng], 14);
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      else markerRef.current = L.marker([lat, lng], { icon: dotIcon(L) }).addTo(mapRef.current);
    })();
  }, [lat, lng]);

  return <div ref={ref} className="z-0 h-64 w-full overflow-hidden rounded-xl border border-border" />;
}

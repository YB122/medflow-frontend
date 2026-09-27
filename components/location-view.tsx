'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * Read-only clinic map (public doctor page). No picking — just a marker.
 * Leaflet loads lazily on the client; render via next/dynamic ssr:false.
 */
export function LocationView({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:22px;height:22px;border-radius:9999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 2px 8px rgba(29,78,216,.5)"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(map);
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return <div ref={ref} className="z-0 h-56 w-full overflow-hidden rounded-xl border border-border" />;
}

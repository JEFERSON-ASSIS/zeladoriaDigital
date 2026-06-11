'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

const occurrences = [
  { id: 'OC-0001', label: 'Buraco na rua principal', lat: -15.601, lng: -56.097, status: 'EM_EXECUCAO', priority: 'ALTA' },
  { id: 'OC-0002', label: 'Lâmpada queimada', lat: -15.605, lng: -56.102, status: 'ABERTO', priority: 'MEDIA' },
  { id: 'OC-0003', label: 'Entulho em via pública', lat: -15.612, lng: -56.09, status: 'ENCAMINHADO', priority: 'URGENTE' }
];

export function ExecutiveMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let map: any;

    async function init() {
      const L = await import('leaflet');
      if (disposed || !mapRef.current) return;

      map = L.map(mapRef.current).setView([-15.601, -56.097], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      occurrences.forEach((item) => {
        L.marker([item.lat, item.lng])
          .addTo(map)
          .bindPopup(
            `<strong>${item.id}</strong><br />${item.label}<br />Status: ${item.status}<br />Prioridade: ${item.priority}`
          );
      });
    }

    void init();

    return () => {
      disposed = true;
      map?.remove?.();
    };
  }, []);

  return <div ref={mapRef} className="leaflet-map" />;
}

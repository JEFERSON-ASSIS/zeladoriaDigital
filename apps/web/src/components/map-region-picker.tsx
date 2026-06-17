'use client';

import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef } from 'react';
import { createCenterPinIcon, createOccurrencePinIcon } from '../lib/leaflet-icons';
import { OCCURRENCE_STATUS_COLORS } from '../lib/occurrence-map';
import { DEFAULT_MAP_REGION, zoomFromRadius } from '../lib/map-region';

export type MapRegionMarker = {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  popupHtml?: string;
};

type MapRegionPickerProps = {
  latitude: number;
  longitude: number;
  raioMetros: number;
  onPick?: (coords: { latitude: number; longitude: number }) => void;
  interactive?: boolean;
  showCenterPin?: boolean;
  markers?: MapRegionMarker[];
};

export function MapRegionPicker({
  latitude,
  longitude,
  raioMetros,
  onPick,
  interactive = true,
  showCenterPin = true,
  markers = []
}: MapRegionPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const onPickRef = useRef(onPick);

  onPickRef.current = onPick;

  const handlePick = useCallback((coords: { latitude: number; longitude: number }) => {
    onPickRef.current?.(coords);
  }, []);

  useEffect(() => {
    let disposed = false;

    async function init() {
      const L = await import('leaflet');
      if (disposed || !mapRef.current) return;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          scrollWheelZoom: interactive,
          attributionControl: false
        }).setView([latitude, longitude], zoomFromRadius(raioMetros));

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ''
        }).addTo(mapInstance.current);

        markersLayerRef.current = L.layerGroup().addTo(mapInstance.current);

        if (interactive) {
          mapInstance.current.on('click', (event: any) => {
            handlePick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
          });
        }
      }

      if (showCenterPin) {
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          markerRef.current = L.marker([latitude, longitude], {
            draggable: interactive,
            icon: createCenterPinIcon(L)
          }).addTo(mapInstance.current);
          if (interactive) {
            markerRef.current.on('dragend', () => {
              const pos = markerRef.current.getLatLng();
              handlePick({ latitude: pos.lat, longitude: pos.lng });
            });
          }
        }
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      if (circleRef.current) {
        circleRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setRadius(raioMetros);
      } else {
        circleRef.current = L.circle([latitude, longitude], {
          radius: raioMetros,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 2
        }).addTo(mapInstance.current);
      }

      mapInstance.current.setView([latitude, longitude], zoomFromRadius(raioMetros));
    }

    void init();

    return () => {
      disposed = true;
    };
  }, [latitude, longitude, raioMetros, interactive, showCenterPin, handlePick]);

  useEffect(() => {
    let disposed = false;

    async function renderMarkers() {
      const L = await import('leaflet');
      if (disposed || !mapInstance.current || !markersLayerRef.current) return;

      markersLayerRef.current.clearLayers();
      markers.forEach((item) => {
        L.marker([item.lat, item.lng], {
          icon: createOccurrencePinIcon(L, item.color ?? OCCURRENCE_STATUS_COLORS.ABERTO)
        })
          .addTo(markersLayerRef.current)
          .bindPopup(item.popupHtml ?? item.label ?? 'Ocorrência');
      });

      if (!interactive && markers.length > 0 && mapInstance.current) {
        const bounds = L.latLngBounds(markers.map((item) => [item.lat, item.lng] as [number, number]));
        bounds.extend([latitude, longitude]);
        mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, duration: 0 });
      }
    }

    void renderMarkers();

    return () => {
      disposed = true;
    };
  }, [markers, latitude, longitude, interactive]);

  useEffect(() => {
    return () => {
      mapInstance.current?.remove?.();
      mapInstance.current = null;
      circleRef.current = null;
      markerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  return (
    <div className="map-region-picker">
      <div ref={mapRef} className="leaflet-map" />
      {interactive ? (
        <p className="muted-copy map-region-picker__hint">
          Clique no mapa ou arraste o marcador para definir o centro da região.
        </p>
      ) : null}
    </div>
  );
}

export function MapRegionPickerPlaceholder() {
  return (
    <MapRegionPicker
      latitude={DEFAULT_MAP_REGION.latitudeCentro}
      longitude={DEFAULT_MAP_REGION.longitudeCentro}
      raioMetros={DEFAULT_MAP_REGION.raioMetros}
      interactive={false}
    />
  );
}

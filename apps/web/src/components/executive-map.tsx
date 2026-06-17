'use client';

import { useQuery } from '@tanstack/react-query';
import { MapRegionPicker } from './map-region-picker';
import { fetchOccurrences, fetchServiceAreas, getStoredAccessToken } from '../lib/api';
import { useOccurrenceMapMarkers } from '../hooks/use-occurrence-map-markers';
import { DEFAULT_MAP_REGION, mapRegionFromServiceArea } from '../lib/map-region';

export function ExecutiveMap() {
  const regionQuery = useQuery({
    queryKey: ['map-region'],
    queryFn: () => fetchServiceAreas(getStoredAccessToken()),
    staleTime: 60_000
  });

  const occurrencesQuery = useQuery({
    queryKey: ['executive-map-occurrences'],
    queryFn: () => fetchOccurrences(getStoredAccessToken()),
    staleTime: 30_000
  });

  const activeArea = (regionQuery.data ?? []).find((area) => area.ativo) ?? regionQuery.data?.[0];
  const region = activeArea ? mapRegionFromServiceArea(activeArea) : DEFAULT_MAP_REGION;
  const { markers, activeCount, withoutLocation, geocoding } = useOccurrenceMapMarkers(
    occurrencesQuery.data ?? [],
    region
  );

  return (
    <section className="executive-map-shell">
      <div className="panel-heading">
        <h3>
          {region.municipio} — {region.estado}
        </h3>
        <span>{markers.length} chamados no mapa</span>
      </div>
      <MapRegionPicker
        latitude={region.latitudeCentro}
        longitude={region.longitudeCentro}
        raioMetros={region.raioMetros}
        interactive={false}
        showCenterPin={false}
        markers={markers}
      />
      {geocoding ? <p className="muted-copy">Localizando chamados pelo endereço...</p> : null}
      {!geocoding && activeCount === 0 ? (
        <p className="muted-copy">Nenhum chamado aberto ou em atendimento.</p>
      ) : null}
      {!geocoding && activeCount > 0 && markers.length === 0 ? (
        <p className="muted-copy">Chamados ativos sem localização para exibir no mapa.</p>
      ) : null}
      {!geocoding && withoutLocation > 0 && markers.length > 0 ? (
        <p className="muted-copy">{withoutLocation} chamado(s) ainda sem pin no mapa.</p>
      ) : null}
    </section>
  );
}

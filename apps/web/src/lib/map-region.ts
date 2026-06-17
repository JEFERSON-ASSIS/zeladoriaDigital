export type MapRegionConfig = {
  id?: string;
  nome: string;
  municipio: string;
  estado: string;
  latitudeCentro: number;
  longitudeCentro: number;
  raioMetros: number;
  validacaoAtiva: boolean;
  bloquearForaDaArea: boolean;
  ativo: boolean;
};

export const DEFAULT_MAP_REGION: MapRegionConfig = {
  nome: 'Região municipal',
  municipio: 'Cuiabá',
  estado: 'MT',
  latitudeCentro: -15.601,
  longitudeCentro: -56.097,
  raioMetros: 15000,
  validacaoAtiva: true,
  bloquearForaDaArea: false,
  ativo: true
};

type ServiceAreaLike = {
  id?: string;
  nome?: string;
  municipio?: string;
  estado?: string;
  latitudeCentro?: number | null;
  longitudeCentro?: number | null;
  raioMetros?: number | null;
  validacaoAtiva?: boolean;
  bloquearForaDaArea?: boolean;
  ativo?: boolean;
};

export function mapRegionFromServiceArea(area: ServiceAreaLike): MapRegionConfig {
  return {
    id: area.id,
    nome: area.nome ?? DEFAULT_MAP_REGION.nome,
    municipio: area.municipio ?? DEFAULT_MAP_REGION.municipio,
    estado: area.estado ?? DEFAULT_MAP_REGION.estado,
    latitudeCentro: area.latitudeCentro ?? DEFAULT_MAP_REGION.latitudeCentro,
    longitudeCentro: area.longitudeCentro ?? DEFAULT_MAP_REGION.longitudeCentro,
    raioMetros: area.raioMetros ?? DEFAULT_MAP_REGION.raioMetros,
    validacaoAtiva: area.validacaoAtiva ?? true,
    bloquearForaDaArea: area.bloquearForaDaArea ?? false,
    ativo: area.ativo ?? true
  };
}

export function zoomFromRadius(raioMetros: number) {
  if (raioMetros <= 3000) return 14;
  if (raioMetros <= 8000) return 13;
  if (raioMetros <= 20000) return 12;
  if (raioMetros <= 50000) return 11;
  return 10;
}

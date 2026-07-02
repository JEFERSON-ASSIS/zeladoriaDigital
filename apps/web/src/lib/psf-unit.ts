import { getPsfById, PSF_OPTIONS, type PsfConfig, type PsfId } from './scheduling/psf-config';
import { PWA_SCOPE } from './pwa-constants';

export const PSF_IDS = ['psf1', 'psf2', 'psf3'] as const;

export function isPsfId(value: string): value is PsfId {
  return PSF_IDS.includes(value as PsfId);
}

export function parsePsfIdFromPath(pathname: string): PsfId | null {
  const match = pathname.match(new RegExp(`${PWA_SCOPE}/unidade/(psf[123])(?:/|$)`));
  if (!match?.[1] || !isPsfId(match[1])) return null;
  return match[1];
}

export function unitBasePath(psfId: PsfId) {
  return `${PWA_SCOPE}/unidade/${psfId}`;
}

export function unitPath(psfId: PsfId, segment = '') {
  const normalized = segment.startsWith('/') ? segment : segment ? `/${segment}` : '';
  return `${unitBasePath(psfId)}${normalized}`;
}

export function unitManifestPath(psfId: PsfId) {
  return `${PWA_SCOPE}/manifest/${psfId}`;
}

export function getPsfUnitConfig(psfId: PsfId): PsfConfig | null {
  return getPsfById(psfId);
}

export function listPsfUnits() {
  return PSF_OPTIONS.filter((item) => item.bookingEnabled);
}

export function buildUnitManifest(psfId: PsfId, origin: string) {
  const psf = getPsfById(psfId);
  if (!psf) return null;

  const scope = `${unitBasePath(psfId)}/`;
  const startUrl = unitPath(psfId, '/agendamento');

  return {
    id: `${origin}${unitBasePath(psfId)}`,
    name: `Prefeitura na Mão — ${psf.label}`,
    short_name: psf.label,
    description: `Agendamento de consultas em ${psf.subtitle}.`,
    lang: 'pt-BR',
    scope,
    start_url: startUrl,
    display: 'standalone',
    display_override: ['standalone', 'fullscreen'],
    orientation: 'portrait',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    prefer_related_applications: false,
    categories: ['health', 'government', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
    ],
    shortcuts: [
      {
        name: 'Agendar consulta',
        short_name: 'Agendar',
        description: `Agendar em ${psf.label}`,
        url: startUrl,
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Minhas consultas',
        short_name: 'Consultas',
        description: 'Ver agendamentos',
        url: unitPath(psfId, '/meus-agendamentos'),
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}

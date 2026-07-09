import { PWA_SCOPE } from './pwa-constants';

/** @deprecated Manifesto genérico removido — use buildUnitManifest em psf-unit.ts */
export function buildCitizenManifest(origin: string) {  const scope = `${PWA_SCOPE}/`;

  return {
    id: `${origin}${scope}`,
    name: 'Prefeitura na Mão',
    short_name: 'Prefeitura na Mão',
    description: 'App do cidadão — solicitações urbanas e agendamento de saúde.',
    lang: 'pt-BR',
    scope,
    start_url: `${PWA_SCOPE}/login?source=pwa`,
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'portrait',
    background_color: '#f2f2f7',
    theme_color: '#2563eb',
    prefer_related_applications: false,
    categories: ['government', 'utilities', 'health'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
    ],
    shortcuts: [
      {
        name: 'Nova ocorrência',
        short_name: 'Ocorrência',
        description: 'Registrar problema na cidade',
        url: `${PWA_SCOPE}/nova-ocorrencia`,
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Minhas solicitações',
        short_name: 'Solicitações',
        description: 'Acompanhar protocolos',
        url: `${PWA_SCOPE}/minhas-solicitacoes`,
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Agendamento',
        short_name: 'Saúde',
        description: 'Agendar atendimento',
        url: `${PWA_SCOPE}/agendamento`,
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}

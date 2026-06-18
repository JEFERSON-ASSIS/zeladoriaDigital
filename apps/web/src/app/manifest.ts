import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Prefeitura na Mão — App do Cidadão',
    short_name: 'Prefeitura na Mão',
    description: 'Registre ocorrências urbanas e agende consultas na unidade de saúde.',
    lang: 'pt-BR',
    scope: '/',
    start_url: '/login',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    categories: ['government', 'utilities', 'health'],
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}

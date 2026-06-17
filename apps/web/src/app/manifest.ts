export default function manifest() {
  return {
    name: 'Zeladoria Digital — i7AI Sistemas',
    short_name: 'Zeladoria',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.svg',
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

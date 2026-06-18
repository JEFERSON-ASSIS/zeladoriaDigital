import type { Metadata, Viewport } from 'next';
import { CitizenPwaRouteGuard } from '../../components/citizen-pwa-route-guard';
import { PwaShell } from '../../components/pwa-shell';

export const metadata: Metadata = {
  title: 'Prefeitura na Mão | App do Cidadão',
  description: 'App do cidadão para solicitações urbanas e agendamento de saúde.',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prefeitura na Mão'
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb'
};

export default function AppPwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="citizen-pwa-root">
      <link rel="manifest" href="/app/manifest.json" />
      <meta name="theme-color" content="#2563eb" />
      <PwaShell>
        <CitizenPwaRouteGuard>{children}</CitizenPwaRouteGuard>
      </PwaShell>
    </div>
  );
}

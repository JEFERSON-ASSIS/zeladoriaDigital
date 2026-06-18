import type { Metadata, Viewport } from 'next';
import { CitizenPwaRouteGuard } from '../../components/citizen-pwa-route-guard';
import { PwaShell } from '../../components/pwa-shell';
import { PWA_IOS_SPLASH_LINKS } from '../../lib/pwa-splash';

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
  themeColor: '#ffffff'
};

export default function AppPwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="citizen-pwa-root">
      {/* Sem crossorigin — Next metadata.manifest quebra instalação no Chrome Android */}
      <link rel="manifest" href="/app/manifest.json" />
      <meta name="theme-color" content="#ffffff" />
      {PWA_IOS_SPLASH_LINKS.map((splash) => (
        <link key={splash.href} rel="apple-touch-startup-image" href={splash.href} media={splash.media} />
      ))}
      <PwaShell>
        <CitizenPwaRouteGuard>{children}</CitizenPwaRouteGuard>
      </PwaShell>
    </div>
  );
}

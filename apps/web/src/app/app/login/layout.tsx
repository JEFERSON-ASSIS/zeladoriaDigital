import type { Metadata, Viewport } from 'next';
import { PwaStandaloneSync } from '../../../components/pwa-standalone-sync';

export const metadata: Metadata = {
  title: 'Prefeitura na Mão | Entrar',
  description: 'Acesse o aplicativo do cidadão.',
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
  themeColor: '#f2f2f7'
};

export default function LoginPwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="citizen-pwa-root">
      <PwaStandaloneSync />
      {children}
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata = {
  title: 'Prefeitura na Mão | i7AI Sistemas',
  description: 'Plataforma municipal Prefeitura na Mão desenvolvida pela i7AI Sistemas',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/icon-512.svg', type: 'image/svg+xml', sizes: '512x512' }
    ],
    apple: [{ url: '/icon-192.svg', type: 'image/svg+xml' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prefeitura na Mão'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        {process.env.NODE_ENV === 'development' ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  if (!/localhost|127\\.0\\.0\\.1/.test(location.hostname)) return;
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function (regs) {
                      regs.forEach(function (reg) { reg.unregister(); });
                    });
                  }
                  if ('caches' in window) {
                    caches.keys().then(function (keys) {
                      keys.forEach(function (key) { caches.delete(key); });
                    });
                  }
                })();
              `
            }}
          />
        ) : null}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

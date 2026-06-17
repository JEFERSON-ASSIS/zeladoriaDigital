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
  title: 'Zeladoria Digital | i7AI Sistemas',
  description: 'Plataforma municipal de zeladoria desenvolvida pela i7AI Sistemas',
  manifest: '/manifest.webmanifest'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563eb'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Zeladoria" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function (registrations) {
                        registrations.forEach(function (registration) {
                          registration.unregister();
                        });
                      });
                    }
                    if ('caches' in window) {
                      caches.keys().then(function (keys) {
                        keys.forEach(function (key) {
                          caches.delete(key);
                        });
                      });
                    }
                  }
                } catch (error) {}
              })();
            `
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

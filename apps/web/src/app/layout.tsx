export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWA_IOS_SPLASH_LINKS } from '../lib/pwa-splash';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata = {
  title: 'Prefeitura na Mão | i7AI Sistemas',
  description: 'Plataforma municipal de gestão desenvolvida pela i7AI Sistemas',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }]
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        {PWA_IOS_SPLASH_LINKS.map((splash) => (
          <link key={splash.href} rel="apple-touch-startup-image" href={splash.href} media={splash.media} />
        ))}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

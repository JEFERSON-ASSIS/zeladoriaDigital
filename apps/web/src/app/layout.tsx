import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Zeladoria Digital',
  description: 'Plataforma municipal de zeladoria'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
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

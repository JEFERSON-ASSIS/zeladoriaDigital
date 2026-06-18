'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { PwaInstallPrompt } from '../components/install-pwa-button';

const isDev = process.env.NODE_ENV === 'development';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (isDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).catch(() => {});
          });
        });
      }
      return;
    }

    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PwaInstallPrompt />
    </QueryClientProvider>
  );
}

'use client';

import { useEffect } from 'react';
import { PwaInstallGate, usePwaDisplayMode } from './pwa-install-gate';
import { registerPwaServiceWorker } from '../lib/pwa';

export function PwaShell({ children }: { children: React.ReactNode }) {
  const { mode, markInstalled } = usePwaDisplayMode();

  useEffect(() => {
    void registerPwaServiceWorker();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('pwa-native');

    const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)');
    const syncStandalone = () => {
      root.classList.toggle('pwa-standalone', media.matches);
    };

    syncStandalone();
    media.addEventListener('change', syncStandalone);
    return () => {
      root.classList.remove('pwa-native', 'pwa-standalone');
      media.removeEventListener('change', syncStandalone);
    };
  }, []);

  if (mode === 'loading') {
    return (
      <main className="offline-screen">
        <section className="offline-card">
          <p className="eyebrow">Prefeitura na Mão</p>
          <h1>Carregando...</h1>
        </section>
      </main>
    );
  }

  if (mode === 'gate') {
    return <PwaInstallGate onInstalled={markInstalled} />;
  }

  if (mode === 'preview') {
    return (
      <>
        <div className="pwa-preview-banner" role="status">
          Modo preview (rede local). Para instalar o app de verdade, use{' '}
          <strong>homolog.prefeituranamao.com.br/app</strong>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

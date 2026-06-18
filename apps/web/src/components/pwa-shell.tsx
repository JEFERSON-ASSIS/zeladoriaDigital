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
      <main className="pwa-splash-screen" aria-busy="true" aria-label="Carregando Prefeitura na Mão">
        <img src="/icons/icon-192.png" alt="" className="pwa-splash-screen__logo" width={120} height={120} />
        <h1 className="pwa-splash-screen__title">Prefeitura na Mão</h1>
        <p className="pwa-splash-screen__tagline">Serviços ao cidadão</p>
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
          Modo preview ({typeof window !== 'undefined' ? window.location.host : 'rede local'}). Para instalar o
          app de verdade, use <strong>homolog.prefeituranamao.com.br/app</strong>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

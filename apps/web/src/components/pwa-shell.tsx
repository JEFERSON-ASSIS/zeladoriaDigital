'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PwaInstallGate, usePwaDisplayMode } from './pwa-install-gate';
import { PwaInstallPrompt } from './install-pwa-button';
import { registerPwaServiceWorker } from '../lib/pwa';
import { isPwaEntryRoute, shouldSkipPwaInstallGate } from '../lib/pwa-constants';
import { PwaStandaloneSync } from './pwa-standalone-sync';

export function PwaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipInstallGate = shouldSkipPwaInstallGate(pathname);
  const isEntryRoute = isPwaEntryRoute(pathname);
  const { mode, markInstalled, enterBrowserMode } = usePwaDisplayMode(skipInstallGate, pathname);

  useEffect(() => {
    void registerPwaServiceWorker();
  }, []);

  if (mode === 'loading') {
    return (
      <main className="pwa-splash-screen" aria-busy="true" aria-label="Carregando Prefeitura na Mão">
        <img src="/icons/icon-192.png" alt="" className="pwa-splash-screen__logo" width={120} height={120} />
        <h1 className="pwa-splash-screen__title">Prefeitura na Mão</h1>
        <p className="pwa-splash-screen__tagline">Serviços ao cidadão</p>
        <div className="pwa-splash-screen__spinner" aria-hidden />
      </main>
    );
  }

  if (mode === 'gate') {
    return <PwaInstallGate onInstalled={markInstalled} onSkip={enterBrowserMode} />;
  }

  if (mode === 'preview') {
    return (
      <>
        <div className="pwa-preview-banner" role="status">
          Modo preview ({typeof window !== 'undefined' ? window.location.host : 'rede local'}). Para instalar o app de
          verdade, use <strong>app.prefeituranamao.com.br/app/unidade/psf1</strong> (ou psf2/psf3)
        </div>
        {children}
      </>
    );
  }

  if (mode === 'standalone') {
    return (
      <>
        <PwaStandaloneSync />
        {children}
      </>
    );
  }

  return (
    <>
      <PwaStandaloneSync />
      {children}
      {isEntryRoute ? <PwaInstallPrompt /> : null}
    </>
  );
}

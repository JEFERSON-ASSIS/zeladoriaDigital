'use client';

import { useEffect, useState } from 'react';

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)')?.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOSDevice() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneMode());
    setShowIOSHelp(isIOSDevice() && !isStandaloneMode());

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIOSHelp(false);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      setShowIOSHelp(true);
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (installed) return null;

  return (
    <section className="pwa-install-card">
      <div>
        <p className="eyebrow">App</p>
        <h3>Instalar aplicativo</h3>
        <p className="muted-copy">
          Acesse mais rápido na tela inicial do celular, sem depender da loja.
        </p>
      </div>
      <div className="pwa-install-actions">
        <button type="button" className="pwa-install-button" onClick={handleInstall}>
          Instalar aplicativo
        </button>
        {showIOSHelp ? (
          <p className="pwa-install-help">
            No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
          </p>
        ) : null}
      </div>
    </section>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

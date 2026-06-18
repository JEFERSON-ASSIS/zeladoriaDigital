'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrandLogo } from './brand-logo';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isAndroidChrome() {
  return /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent);
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstallGate({ onInstalled }: { onInstalled: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const ios = isIOSDevice();
  const android = isAndroidChrome();

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      onInstalled();
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [onInstalled]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'accepted') onInstalled();
  }, [deferredPrompt, onInstalled]);

  return (
    <div className="pwa-install-gate">
      <div className="pwa-install-gate__card">
        <BrandLogo variant="dark" size="md" showTagline={false} />
        <p className="eyebrow">App do cidadão</p>
        <h1>Instale o aplicativo</h1>

        {android ? (
          <div className="pwa-install-gate__warn">
            <strong>Atenção:</strong> &quot;Adicionar à tela inicial&quot; <em>não</em> instala o app — continua com barra do Chrome.
            Use <strong>Instalar app</strong>.
          </div>
        ) : null}

        {ios ? (
          <ol className="pwa-install-gate__steps">
            <li>Toque em <strong>Compartilhar</strong> no Safari</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong></li>
            <li>Feche o Safari e abra pelo ícone na tela inicial</li>
          </ol>
        ) : deferredPrompt ? (
          <>
            <p className="pwa-install-gate__copy">Toque abaixo para instalar. Depois abra pelo ícone na tela inicial.</p>
            <button type="button" className="btn-primary pwa-install-gate__btn" onClick={() => void handleInstall()}>
              Instalar aplicativo
            </button>
          </>
        ) : (
          <ol className="pwa-install-gate__steps">
            <li>Toque no menu <strong>⋮</strong> do Chrome</li>
            <li>Escolha <strong>Instalar app</strong> (não use &quot;Adicionar à tela inicial&quot;)</li>
            <li>Remova atalhos antigos da tela inicial</li>
            <li>Abra pelo ícone novo instalado</li>
          </ol>
        )}

        <p className="pwa-install-gate__hint">
          Se a barra de endereço do Chrome ainda aparecer, o app não foi instalado corretamente.
        </p>
      </div>
    </div>
  );
}

export function usePwaDisplayMode() {
  const [mode, setMode] = useState<'loading' | 'standalone' | 'gate'>('loading');

  useEffect(() => {
    if (isStandaloneMode()) {
      setMode('standalone');
      return;
    }
    setMode('gate');
  }, []);

  const markInstalled = useCallback(() => {
    if (isStandaloneMode()) {
      setMode('standalone');
    }
  }, []);

  return { mode, markInstalled };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const DISMISS_KEY = 'zeladoria-pwa-install-dismissed';

function isStandaloneMode() {
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function wasDismissed() {
  return window.localStorage.getItem(DISMISS_KEY) === '1';
}

export type InstallPWAButtonProps = {
  /** `toast` = aviso flutuante; `card` = bloco embutido (admin) */
  variant?: 'toast' | 'card';
  /** Não fecha sozinho nem grava dismiss no /app */
  persistent?: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPWAButton({ variant = 'toast', persistent = false }: InstallPWAButtonProps) {
  const [ready, setReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setShowCard(false);
    window.localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (isStandaloneMode()) return;
    if (!persistent && wasDismissed()) return;

    const ios = isIOSDevice();
    setIosMode(ios);

    if (variant === 'card') {
      setShowCard(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    if (ios) {
      const timer = window.setTimeout(() => setVisible(true), 1200);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [ready, variant, persistent]);

  useEffect(() => {
    if (!visible || variant !== 'toast' || persistent) return;
    const timer = window.setTimeout(() => dismiss(), 12000);
    return () => window.clearTimeout(timer);
  }, [visible, variant, dismiss, persistent]);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') {
        setVisible(false);
        return;
      }
    }
    dismiss();
  }

  function handleDismiss() {
    if (!persistent) dismiss();
  }

  if (!ready) return null;

  if (variant === 'card' && showCard) {
    return (
      <section className="pwa-install-card">
        <div>
          <p className="eyebrow">App</p>
          <h3>Instalar aplicativo</h3>
          <p className="muted-copy">Acesse mais rápido na tela inicial do celular.</p>
        </div>
        <div className="pwa-install-actions">
          <button type="button" className="pwa-install-button" onClick={() => void handleInstall()}>
            Instalar aplicativo
          </button>
        </div>
      </section>
    );
  }

  if (!visible) return null;

  const toast = (
    <div className="pwa-install-toast" role="status" aria-live="polite">
      <div className="pwa-install-toast__body">
        <strong>{iosMode ? 'Adicionar à tela inicial' : 'Instalar Prefeitura na Mão'}</strong>
        <p>
          {iosMode
            ? 'Toque em Compartilhar e depois em Adicionar à Tela de Início.'
            : 'Acesso rápido no celular, como um app nativo.'}
        </p>
      </div>
      <div className="pwa-install-toast__actions">
        {!iosMode && deferredPrompt ? (
          <button type="button" className="pwa-install-toast__install" onClick={() => void handleInstall()}>
            Instalar
          </button>
        ) : null}
        {!persistent ? (
          <button type="button" className="pwa-install-toast__close" onClick={handleDismiss} aria-label="Fechar aviso">
            ×
          </button>
        ) : null}
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

export function PwaInstallPrompt() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
  }, []);

  if (!active) return null;

  return <InstallPWAButton variant="toast" persistent />;
}

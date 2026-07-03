'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePwaInstallPrompt } from '../lib/pwa-install';

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

export function InstallPWAButton({ variant = 'toast', persistent = false }: InstallPWAButtonProps) {
  const [ready, setReady] = useState(false);
  const { canInstall, requestInstall } = usePwaInstallPrompt();
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

    function onAppInstalled() {
      setVisible(false);
    }

    window.addEventListener('appinstalled', onAppInstalled);

    const showFallbackTimer = window.setTimeout(() => setVisible(true), ios ? 1200 : 2500);

    return () => {
      window.clearTimeout(showFallbackTimer);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [ready, variant, persistent]);

  useEffect(() => {
    if (canInstall && variant === 'toast') setVisible(true);
  }, [canInstall, variant]);

  useEffect(() => {
    if (!visible || variant !== 'toast' || persistent) return;
    const timer = window.setTimeout(() => dismiss(), 12000);
    return () => window.clearTimeout(timer);
  }, [visible, variant, dismiss, persistent]);

  async function handleInstall() {
    if (canInstall) {
      const choice = await requestInstall();
      if (choice?.outcome === 'accepted') {
        setVisible(false);
        return;
      }
    }
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
            : canInstall
              ? 'Acesso rápido no celular, como um app nativo.'
              : 'Menu ⋮ do Chrome → Instalar app (não use "Adicionar à tela inicial").'}
        </p>
      </div>
      <div className="pwa-install-toast__actions">
        {!iosMode ? (
          <button type="button" className="pwa-install-toast__install" onClick={() => void handleInstall()}>
            {canInstall ? 'Instalar' : 'Como instalar'}
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

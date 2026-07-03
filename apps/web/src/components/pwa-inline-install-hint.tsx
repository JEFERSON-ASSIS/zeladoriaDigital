'use client';

import { useEffect, useState } from 'react';
import { isStandaloneDisplayMode } from '../lib/pwa';
import { usePwaInstallPrompt } from '../lib/pwa-install';

function isAndroidChrome() {
  return /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent);
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInlineInstallHint() {
  const [visible, setVisible] = useState(false);
  const [manualHelp, setManualHelp] = useState(false);
  const { canInstall, requestInstall } = usePwaInstallPrompt();
  const android = isAndroidChrome();
  const ios = isIOSDevice();
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;

  useEffect(() => {
    setVisible(!isStandaloneDisplayMode());

    function hideAfterInstall() {
      setVisible(false);
    }

    window.addEventListener('appinstalled', hideAfterInstall);
    return () => window.removeEventListener('appinstalled', hideAfterInstall);
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (!canInstall) {
      setManualHelp(true);
      return;
    }

    const choice = await requestInstall();
    if (choice?.outcome === 'accepted') setVisible(false);
  }

  return (
    <section className="pwa-inline-install-hint" aria-label="Como instalar o aplicativo">
      <div className="pwa-inline-install-hint__header">
        <div>
          <p className="pwa-inline-install-hint__title">Tenha o app no seu celular</p>
          <p className="pwa-inline-install-hint__copy">Este botão continuará disponível enquanto o app não estiver instalado.</p>
        </div>
        <button type="button" className="pwa-inline-install-hint__button" onClick={() => void handleInstall()}>
          {canInstall ? 'Instalar aplicativo' : ios ? 'Como adicionar' : 'Adicionar à tela inicial'}
        </button>
      </div>

      {insecure ? (
        <p className="pwa-inline-install-hint__warn">
          Conexão não segura (cadeado vermelho). O Chrome só instala com HTTPS válido — peça ao administrador
          corrigir o certificado do site.
        </p>
      ) : null}

      {android && (!canInstall || manualHelp) ? (
        <ol className="pwa-inline-install-hint__steps">
          <li>
            Toque no menu <strong>⋮</strong> do Chrome (canto superior direito)
          </li>
          <li>
            Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>
          </li>
          <li>Não use atalho antigo de homolog — instale de novo neste endereço</li>
        </ol>
      ) : ios ? (
        <ol className="pwa-inline-install-hint__steps">
          <li>Toque em <strong>Compartilhar</strong></li>
          <li>Escolha <strong>Adicionar à Tela de Início</strong></li>
        </ol>
      ) : !canInstall || manualHelp ? (
        <ol className="pwa-inline-install-hint__steps">
          <li>Use o menu do navegador para instalar ou adicionar à tela inicial</li>
        </ol>
      ) : null}
    </section>
  );
}

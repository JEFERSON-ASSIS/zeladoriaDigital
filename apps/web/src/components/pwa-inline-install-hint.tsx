'use client';

import { useEffect, useState } from 'react';
import { isStandaloneDisplayMode } from '../lib/pwa';

function isAndroidChrome() {
  return /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent);
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInlineInstallHint() {
  const [visible, setVisible] = useState(false);
  const android = isAndroidChrome();
  const ios = isIOSDevice();
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;

  useEffect(() => {
    setVisible(!isStandaloneDisplayMode());
  }, []);

  if (!visible) return null;

  return (
    <section className="pwa-inline-install-hint" aria-label="Como instalar o aplicativo">
      <p className="pwa-inline-install-hint__title">Instale o app na tela inicial</p>

      {insecure ? (
        <p className="pwa-inline-install-hint__warn">
          Conexão não segura (cadeado vermelho). O Chrome só instala com HTTPS válido — peça ao administrador
          corrigir o certificado do site.
        </p>
      ) : null}

      {android ? (
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
      ) : (
        <ol className="pwa-inline-install-hint__steps">
          <li>Use o menu do navegador para instalar ou adicionar à tela inicial</li>
        </ol>
      )}
    </section>
  );
}

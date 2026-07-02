'use client';

import { useEffect, useState } from 'react';
import { isStandaloneDisplayMode } from '../lib/pwa';

export function UnitInstallHint({ unitLabel }: { unitLabel: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isStandaloneDisplayMode());
  }, []);

  if (!visible) return null;

  return (
    <section className="citizen-unit-install-hint" aria-label="Como instalar o app da unidade">
      <p className="citizen-unit-install-hint__title">Instalar atalho de {unitLabel}</p>
      <ol className="citizen-unit-install-hint__steps">
        <li>
          Remova da tela inicial o app <strong>Prefeitura na Mão</strong> (se existir).
        </li>
        <li>
          Nesta página, use <strong>Instalar app</strong> no Chrome (não use &quot;Adicionar à tela inicial&quot;).
        </li>
        <li>O ícone novo deve aparecer como <strong>{unitLabel}</strong> e abrir direto nesta unidade.</li>
      </ol>
    </section>
  );
}

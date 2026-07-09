'use client';

import { useEffect } from 'react';

/** Aplica classes de modo nativo/standalone sem gate de instalação (ex.: login dentro do PWA). */
export function PwaStandaloneSync() {
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

  return null;
}

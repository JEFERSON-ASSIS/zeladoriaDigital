'use client';

import { useLayoutEffect } from 'react';
import type { PsfId } from '../lib/scheduling/psf-config';
import { unitManifestPath } from '../lib/psf-unit';

export function UnitPwaHead({ psfId, title }: { psfId: PsfId; title: string }) {
  const manifestHref = unitManifestPath(psfId);

  useLayoutEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((node) => node.remove());

    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = manifestHref;
    document.head.appendChild(manifest);

    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.setAttribute('name', 'apple-mobile-web-app-title');
      document.head.appendChild(appleTitle);
    }
    appleTitle.setAttribute('content', title);

    document.title = `${title} — Agendamento`;
  }, [manifestHref, title]);

  return null;
}

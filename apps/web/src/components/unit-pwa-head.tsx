'use client';

import { useLayoutEffect } from 'react';
import type { PsfId } from '../lib/scheduling/psf-config';
import { unitManifestPath } from '../lib/psf-unit';

const UNIT_MANIFEST_ID = 'zeladoria-unit-manifest';

/** @deprecated Prefer generateMetadata no layout da unidade. Mantido só se precisar override em runtime. */
export function UnitPwaHead({ psfId, title }: { psfId: PsfId; title: string }) {
  const manifestHref = unitManifestPath(psfId);

  useLayoutEffect(() => {
    let link = document.getElementById(UNIT_MANIFEST_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = UNIT_MANIFEST_ID;
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestHref;

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

'use client';

import { useLayoutEffect } from 'react';
import type { PsfId } from '../lib/scheduling/psf-config';
import { unitManifestPath } from '../lib/psf-unit';

const UNIT_MANIFEST_ID = 'zeladoria-unit-manifest';

function setSingleManifestLink(href: string) {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="manifest"]'));
  const link = links[0] ?? document.createElement('link');

  link.id = UNIT_MANIFEST_ID;
  link.rel = 'manifest';
  link.href = href;

  if (!link.parentNode) {
    document.head.appendChild(link);
  }

  links.slice(1).forEach((extraLink) => extraLink.remove());
}

/** @deprecated Prefer generateMetadata no layout da unidade. Mantido só se precisar override em runtime. */
export function UnitPwaHead({ psfId, title }: { psfId: PsfId; title: string }) {
  const manifestHref = unitManifestPath(psfId);

  useLayoutEffect(() => {
    setSingleManifestLink(manifestHref);

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

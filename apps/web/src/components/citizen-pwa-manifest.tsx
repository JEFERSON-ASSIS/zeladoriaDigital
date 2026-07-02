'use client';

import { usePathname } from 'next/navigation';
import { PWA_MANIFEST_URL } from '../lib/pwa-constants';
import { parsePsfIdFromPath, unitManifestPath } from '../lib/psf-unit';

export function CitizenPwaManifest() {
  const pathname = usePathname();
  const psfId = parsePsfIdFromPath(pathname);
  const href = psfId ? unitManifestPath(psfId) : PWA_MANIFEST_URL;

  return <link rel="manifest" href={href} />;
}

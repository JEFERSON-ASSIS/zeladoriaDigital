'use client';

import { Suspense, useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PWA_MANIFEST_URL } from '../lib/pwa-constants';
import { parsePsfIdFromPath, unitManifestPath } from '../lib/psf-unit';

function LoginPwaHeadInner() {
  const searchParams = useSearchParams();
  const returnPath = searchParams.get('return');
  const psfId = returnPath ? parsePsfIdFromPath(returnPath) : null;
  const manifestHref = psfId ? unitManifestPath(psfId) : PWA_MANIFEST_URL;

  useLayoutEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((node) => node.remove());

    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = manifestHref;
    document.head.appendChild(manifest);
  }, [manifestHref]);

  return null;
}

export function LoginPwaHead() {
  return (
    <Suspense fallback={null}>
      <LoginPwaHeadInner />
    </Suspense>
  );
}

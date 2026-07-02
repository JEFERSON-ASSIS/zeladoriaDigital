'use client';

import { Suspense, useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PWA_MANIFEST_URL } from '../lib/pwa-constants';
import { parsePsfIdFromPath, unitManifestPath } from '../lib/psf-unit';

const LOGIN_MANIFEST_ID = 'zeladoria-login-manifest';

function LoginPwaHeadInner() {
  const searchParams = useSearchParams();
  const returnPath = searchParams.get('return');
  const psfId = returnPath ? parsePsfIdFromPath(returnPath) : null;
  const manifestHref = psfId ? unitManifestPath(psfId) : PWA_MANIFEST_URL;

  useLayoutEffect(() => {
    let link = document.getElementById(LOGIN_MANIFEST_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = LOGIN_MANIFEST_ID;
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestHref;
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

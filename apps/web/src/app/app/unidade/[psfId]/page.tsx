'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePsfUnit } from '../../../../components/psf-unit-provider';
import { getSession } from '../../../../lib/auth';
import { buildPwaLoginUrl } from '../../../../lib/pwa';

export default function PsfUnitLandingPage() {
  const router = useRouter();
  const unit = usePsfUnit();

  useEffect(() => {
    if (!unit) return;

    const session = getSession();
    if (!session) {
      router.replace(buildPwaLoginUrl(unit.path('/agendamento')));
      return;
    }

    router.replace(unit.path('/agendamento'));
  }, [router, unit]);

  if (!unit) return null;

  return (
    <main className="pwa-splash-screen" aria-busy="true" aria-label={`Abrindo ${unit.psf.label}`}>
      <img src="/icons/icon-192.png" alt="" className="pwa-splash-screen__logo" width={120} height={120} />
      <h1 className="pwa-splash-screen__title">{unit.psf.label}</h1>
      <p className="pwa-splash-screen__tagline">{unit.psf.subtitle}</p>
      <div className="pwa-splash-screen__spinner" aria-hidden />
    </main>
  );
}

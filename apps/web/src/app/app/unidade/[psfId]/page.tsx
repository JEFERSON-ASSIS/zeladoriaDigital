'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../../lib/auth';
import { resolveCitizenPwaHome } from '../../../../lib/citizen-pwa-access';
import { buildPwaLoginUrl, PWA_LOGIN } from '../../../../lib/pwa';
import { isPsfId, unitPath } from '../../../../lib/psf-unit';

type UnitEntryPageProps = {
  params: { psfId: string };
};

export default function UnitEntryPage({ params }: UnitEntryPageProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isPsfId(params.psfId)) {
      router.replace(PWA_LOGIN);
      return;
    }

    const session = getSession();
    if (!session || session.user.role !== 'CIDADAO') {
      router.replace(buildPwaLoginUrl(unitPath(params.psfId)));
      return;
    }

    router.replace(resolveCitizenPwaHome(session.user.menuKeys, session.user.healthUnitPsfId));
  }, [params.psfId, router]);

  return (
    <main className="offline-screen" aria-busy="true">
      <section className="offline-card">
        <p className="eyebrow">Prefeitura na Mão</p>
        <h1>Abrindo o aplicativo...</h1>
      </section>
    </main>
  );
}

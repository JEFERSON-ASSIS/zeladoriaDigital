'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../lib/auth';
import { resolveCitizenPwaHome } from '../../../lib/citizen-pwa-access';
import { buildPwaLoginUrl, PWA_LOGIN } from '../../../lib/pwa';
import { isPsfId, unitPath } from '../../../lib/psf-unit';

export default function PwaLauncherPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      const unit = new URLSearchParams(window.location.search).get('unit');
      router.replace(unit && isPsfId(unit) ? buildPwaLoginUrl(unitPath(unit)) : PWA_LOGIN);
      return;
    }

    if (session.user.role === 'CIDADAO') {
      const home = resolveCitizenPwaHome(session.user.menuKeys, session.user.healthUnitPsfId);
      if (home !== PWA_LOGIN) {
        router.replace(home);
      }
      return;
    }

    router.replace('/');
  }, [router]);

  const session = getSession();
  const noModules =
    session?.user.role === 'CIDADAO' &&
    resolveCitizenPwaHome(session.user.menuKeys, session.user.healthUnitPsfId) === PWA_LOGIN;

  return (
    <main className="offline-screen">
      <section className="offline-card">
        <p className="eyebrow">Prefeitura na Mão</p>
        <h1>{noModules ? 'Nenhum serviço disponível' : 'Abrindo o aplicativo...'}</h1>
        {noModules ? (
          <p className="scheduling-copy">
            Os módulos do aplicativo estão temporariamente indisponíveis. Tente novamente mais tarde.
          </p>
        ) : null}
      </section>
    </main>
  );
}

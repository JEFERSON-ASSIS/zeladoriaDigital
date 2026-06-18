'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { resolveCitizenPwaHome } from '../../lib/citizen-pwa-access';
import { PWA_LOGIN } from '../../lib/pwa';

export default function PwaLauncherPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace(PWA_LOGIN);
      return;
    }

    if (session.user.role === 'CIDADAO') {
      const home = resolveCitizenPwaHome(session.user.menuKeys);
      if (home !== PWA_LOGIN) {
        router.replace(home);
      }
      return;
    }

    router.replace('/');
  }, [router]);

  const session = getSession();
  const noModules =
    session?.user.role === 'CIDADAO' && resolveCitizenPwaHome(session.user.menuKeys) === PWA_LOGIN;

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

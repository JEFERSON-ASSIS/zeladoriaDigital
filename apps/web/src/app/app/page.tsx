'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { PWA_HOME, PWA_LOGIN } from '../../lib/pwa';

export default function PwaLauncherPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace(PWA_LOGIN);
      return;
    }

    if (session.user.role === 'CIDADAO') {
      router.replace(PWA_HOME);
      return;
    }

    router.replace('/');
  }, [router]);

  return (
    <main className="offline-screen">
      <section className="offline-card">
        <p className="eyebrow">Prefeitura na Mão</p>
        <h1>Abrindo o aplicativo...</h1>
      </section>
    </main>
  );
}

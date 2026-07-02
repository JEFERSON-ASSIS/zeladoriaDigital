'use client';

import { useRouter } from 'next/navigation';
import { CitizenEmptyState } from '../../components/citizen-empty-state';
import { pwaPath } from '../../lib/pwa';

export default function OfflinePage() {
  const router = useRouter();

  return (
    <main className="offline-screen">
      <CitizenEmptyState
        icon="wifi"
        title="Você está sem conexão"
        description="Algumas telas já visitadas podem continuar disponíveis. Quando a internet voltar, atualize para ver os dados mais recentes."
        actionLabel="Tentar novamente"
        onAction={() => {
          if (typeof window !== 'undefined' && window.navigator.onLine) {
            router.replace(pwaPath('/inicio'));
            return;
          }
          window.location.reload();
        }}
        secondaryLabel="Ir para o início"
        secondaryHref={pwaPath('/inicio')}
      />
    </main>
  );
}

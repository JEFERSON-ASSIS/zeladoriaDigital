'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CitizenShell } from '../../components/citizen-shell';
import { getSession } from '../../lib/auth';
import { canAccessCitizenPwaPath, resolveCitizenPwaHome } from '../../lib/citizen-pwa-access';
import { listPsfUnits, unitPath } from '../../lib/psf-unit';
import { PWA_LOGIN, pwaPath } from '../../lib/pwa';
import type { MenuKey } from '@zeladoria/shared';

export default function CitizenHealthHubPage() {
  const router = useRouter();
  const [menuKeys, setMenuKeys] = useState<MenuKey[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace(PWA_LOGIN);
      return;
    }

    const keys = session.user.menuKeys ?? [];
    if (!canAccessCitizenPwaPath(pwaPath('/saude'), keys)) {
      router.replace(resolveCitizenPwaHome(keys));
      return;
    }

    setMenuKeys(keys);
    setReady(true);
  }, [router]);

  const canAgendar = menuKeys.includes('agendamento');
  const canConsultas = menuKeys.includes('meus-agendamentos');

  if (!ready) {
    return (
      <CitizenShell title="Saúde" subtitle="Carregando serviços de saúde..." loading loadingVariant="list" />
    );
  }

  return (
    <CitizenShell title="Saúde" subtitle="Agende consultas e acompanhe seus atendimentos.">
      <div className="citizen-hub-grid">
        {canAgendar ? (
          <Link href={pwaPath('/agendamento')} className="citizen-hub-card">
            <span className="citizen-hub-card__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <strong>Agendar consulta</strong>
              <p>Escolha unidade, data e horário disponível.</p>
            </div>
          </Link>
        ) : null}

        {canConsultas ? (
          <Link href={pwaPath('/meus-agendamentos')} className="citizen-hub-card">
            <span className="citizen-hub-card__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <strong>Minhas consultas</strong>
              <p>Veja agendamentos confirmados e histórico.</p>
            </div>
          </Link>
        ) : null}
      </div>

      <h3 className="form-section-title" style={{ marginTop: 24 }}>
        Atalhos por unidade
      </h3>
      <p className="scheduling-copy">
        Compartilhe ou instale o app de cada PSF separadamente na tela inicial do celular.
      </p>
      <div className="citizen-hub-grid">
        {listPsfUnits().map((psf) => (
          <Link key={psf.id} href={unitPath(psf.id)} className="citizen-hub-card">
            <span className="citizen-hub-card__icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <div>
              <strong>{psf.label}</strong>
              <p>{psf.subtitle} — link para instalar atalho dedicado</p>
            </div>
          </Link>
        ))}
      </div>
    </CitizenShell>
  );
}

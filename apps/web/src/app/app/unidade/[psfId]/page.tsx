'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CitizenUnitShell } from '../../../../components/citizen-unit-shell';
import { usePsfUnit } from '../../../../components/psf-unit-provider';
import { getSession } from '../../../../lib/auth';
import { buildPwaLoginUrl } from '../../../../lib/pwa';

export default function PsfUnitLandingPage() {
  const router = useRouter();
  const unit = usePsfUnit();

  useEffect(() => {
    if (!unit) return;
    if (!getSession()) {
      router.replace(buildPwaLoginUrl(unit.path()));
    }
  }, [router, unit]);

  if (!unit) return null;

  return (
    <CitizenUnitShell title={unit.psf.label} subtitle={unit.psf.subtitle}>
      <section className="citizen-unit-landing">
        <div className="citizen-unit-landing__badge">{unit.psf.label}</div>
        <h3>Bem-vindo</h3>
        <p>
          Agende consultas e acompanhe seus atendimentos em <strong>{unit.psf.label}</strong>.
        </p>

        <div className="citizen-unit-landing__actions">
          <Link href={unit.path('/agendamento')} className="btn-primary citizen-empty-state__btn">
            Agendar consulta
          </Link>
          <Link href={unit.path('/meus-agendamentos')} className="btn-secondary citizen-empty-state__btn">
            Minhas consultas
          </Link>
        </div>

        <p className="citizen-unit-landing__hint">
          Use o menu abaixo para navegar entre Início, Agendar e Consultas.
        </p>
      </section>
    </CitizenUnitShell>
  );
}

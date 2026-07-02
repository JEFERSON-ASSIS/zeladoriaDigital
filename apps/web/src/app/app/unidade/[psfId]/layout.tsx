import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { CitizenPwaRouteGuard } from '../../../../components/citizen-pwa-route-guard';
import { PsfUnitProvider } from '../../../../components/psf-unit-provider';
import { PwaShell } from '../../../../components/pwa-shell';
import { UnitPwaHead } from '../../../../components/unit-pwa-head';
import { getPsfUnitConfig, isPsfId, unitManifestPath } from '../../../../lib/psf-unit';

type UnitLayoutProps = {
  children: React.ReactNode;
  params: { psfId: string };
};

export function generateMetadata({ params }: UnitLayoutProps): Metadata {
  if (!isPsfId(params.psfId)) {
    return { title: 'Unidade não encontrada' };
  }

  const psf = getPsfUnitConfig(params.psfId);
  if (!psf) {
    return { title: 'Unidade não encontrada' };
  }

  return {
    title: `${psf.label} — Agendamento`,
    description: `Agende consultas em ${psf.subtitle}.`,
    manifest: unitManifestPath(psf.id),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: psf.label
    }
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f2f2f7'
};

export default function PsfUnitLayout({ children, params }: UnitLayoutProps) {
  if (!isPsfId(params.psfId) || !getPsfUnitConfig(params.psfId)) {
    notFound();
  }

  const psf = getPsfUnitConfig(params.psfId)!;

  return (
    <div className="citizen-pwa-root citizen-pwa-root--unit">
      <UnitPwaHead psfId={params.psfId} title={psf.label} />
      <PwaShell>
        <CitizenPwaRouteGuard>
          <PsfUnitProvider psfId={params.psfId}>{children}</PsfUnitProvider>
        </CitizenPwaRouteGuard>
      </PwaShell>
    </div>
  );
}

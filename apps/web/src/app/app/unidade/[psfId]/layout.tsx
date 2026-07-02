import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { PsfUnitProvider } from '../../../../components/psf-unit-provider';
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

  return (
    <div className="citizen-pwa-root citizen-pwa-root--unit">
      <PsfUnitProvider psfId={params.psfId}>{children}</PsfUnitProvider>
    </div>
  );
}

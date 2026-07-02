'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../lib/auth';
import { buildPwaLoginUrl } from '../lib/pwa';
import type { PsfId } from '../lib/scheduling/psf-config';
import { unitPath } from '../lib/psf-unit';

export function CitizenHealthUnitGuard({ psfId, children }: { psfId: PsfId; children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session || session.user.role !== 'CIDADAO') return;

    const assigned = session.user.healthUnitPsfId;

    if (!assigned) {
      router.replace(buildPwaLoginUrl(unitPath(psfId)));
      return;
    }

    if (assigned !== psfId) {
      router.replace(unitPath(assigned as PsfId));
    }
  }, [psfId, router]);

  return children;
}

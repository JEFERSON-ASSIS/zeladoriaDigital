'use client';

import { usePathname } from 'next/navigation';
import { getSession } from '../lib/auth';
import {
  getPsfUnitConfig,
  isPsfId,
  parsePsfIdFromPath,
  unitBasePath,
  unitPath
} from '../lib/psf-unit';
import type { PsfConfig, PsfId } from '../lib/scheduling/psf-config';
import { usePsfUnit, type PsfUnitContextValue } from '../components/psf-unit-provider';

export function useResolvedPsfUnit(): PsfUnitContextValue | null {
  const unitCtx = usePsfUnit();
  const pathname = usePathname();

  if (unitCtx) return unitCtx;

  const fromUrl = parsePsfIdFromPath(pathname);
  if (fromUrl) {
    const psf = getPsfUnitConfig(fromUrl);
    if (psf) return buildUnitContext(fromUrl, psf);
  }

  const fromSession = getSession()?.user?.healthUnitPsfId;
  if (fromSession && isPsfId(fromSession)) {
    const psf = getPsfUnitConfig(fromSession);
    if (psf) return buildUnitContext(fromSession, psf);
  }

  return null;
}

function buildUnitContext(psfId: PsfId, psf: PsfConfig): PsfUnitContextValue {
  return {
    psfId,
    psf,
    basePath: unitBasePath(psfId),
    path: (segment = '') => unitPath(psfId, segment)
  };
}

'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import type { PsfConfig, PsfId } from '../lib/scheduling/psf-config';
import { savePsfChoice } from '../lib/scheduling/psf-storage';
import { getPsfUnitConfig, unitBasePath, unitPath } from '../lib/psf-unit';

export type PsfUnitContextValue = {
  psfId: PsfId;
  psf: PsfConfig;
  basePath: string;
  path: (segment?: string) => string;
};

const PsfUnitContext = createContext<PsfUnitContextValue | null>(null);

export function PsfUnitProvider({ psfId, children }: { psfId: PsfId; children: React.ReactNode }) {
  const psf = getPsfUnitConfig(psfId);

  const value = useMemo<PsfUnitContextValue | null>(() => {
    if (!psf) return null;
    return {
      psfId,
      psf,
      basePath: unitBasePath(psfId),
      path: (segment = '') => unitPath(psfId, segment)
    };
  }, [psf, psfId]);

  useEffect(() => {
    if (psfId) savePsfChoice(psfId);
  }, [psfId]);

  if (!value) return null;

  return <PsfUnitContext.Provider value={value}>{children}</PsfUnitContext.Provider>;
}

export function usePsfUnit() {
  return useContext(PsfUnitContext);
}

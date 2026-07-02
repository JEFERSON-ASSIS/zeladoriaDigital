export const HEALTH_UNIT_PSF_IDS = ['psf1', 'psf2', 'psf3'] as const;

export type HealthUnitPsfId = (typeof HEALTH_UNIT_PSF_IDS)[number];

export const HEALTH_UNIT_LABELS: Record<HealthUnitPsfId, string> = {
  psf1: 'PSF 1',
  psf2: 'PSF 2',
  psf3: 'UBS Rural'
};

export function isHealthUnitPsfId(value: string): value is HealthUnitPsfId {
  return (HEALTH_UNIT_PSF_IDS as readonly string[]).includes(value);
}

export function getHealthUnitLabel(psfId: string | null | undefined) {
  if (!psfId || !isHealthUnitPsfId(psfId)) return 'Sem unidade';
  return HEALTH_UNIT_LABELS[psfId];
}

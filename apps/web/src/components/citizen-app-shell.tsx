'use client';

import { CitizenShell } from './citizen-shell';
import type { CitizenShellProps } from './citizen-shell';
import { CitizenUnitShell } from './citizen-unit-shell';
import { usePsfUnit } from './psf-unit-provider';

type CitizenAppShellProps = CitizenShellProps & {
  loading?: boolean;
  loadingVariant?: CitizenShellProps['loadingVariant'];
};

function CitizenAppShellInner(props: CitizenAppShellProps) {
  const unit = usePsfUnit();
  if (unit) {
    return (
      <CitizenUnitShell title={props.title} subtitle={props.subtitle}>
        {props.children}
      </CitizenUnitShell>
    );
  }
  return <CitizenShell {...props} />;
}

export function CitizenAppShell(props: CitizenAppShellProps) {
  const unitFromRoute = usePsfUnit();
  if (unitFromRoute) {
    return (
      <CitizenUnitShell title={props.title} subtitle={props.subtitle}>
        {props.children}
      </CitizenUnitShell>
    );
  }

  return <CitizenShell {...props} />;
}

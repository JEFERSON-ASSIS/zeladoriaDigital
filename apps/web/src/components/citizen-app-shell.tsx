'use client';

import { getSession } from '../lib/auth';
import { getPsfUnitConfig, isPsfId } from '../lib/psf-unit';
import { CitizenShell } from './citizen-shell';
import type { CitizenShellProps } from './citizen-shell';
import { CitizenUnitShell } from './citizen-unit-shell';
import { PsfUnitProvider, usePsfUnit } from './psf-unit-provider';

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

  const boundPsfId = getSession()?.user?.healthUnitPsfId;
  if (boundPsfId && isPsfId(boundPsfId) && getPsfUnitConfig(boundPsfId)) {
    return (
      <PsfUnitProvider psfId={boundPsfId}>
        <CitizenAppShellInner {...props} />
      </PsfUnitProvider>
    );
  }

  return <CitizenShell {...props} />;
}

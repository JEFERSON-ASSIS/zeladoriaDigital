'use client';

import { useState } from 'react';
import type { PsfConfig, PsfId } from '../lib/scheduling/psf-config';
import { PSF_OPTIONS } from '../lib/scheduling/psf-config';

type PsfSelectionFlowProps = {
  onConfirmed: (psfId: PsfId) => void;
};

export function PsfSelectionFlow({ onConfirmed }: PsfSelectionFlowProps) {
  const [candidate, setCandidate] = useState<PsfConfig | null>(null);

  function confirmChoice() {
    if (!candidate) return;
    onConfirmed(candidate.id);
  }

  if (candidate) {
    return (
      <section className="panel scheduling-panel">
        <p className="eyebrow">Confirmação</p>
        <h3>Está correto este local?</h3>
        <div className="scheduling-confirm-card">
          <strong>{candidate.label}</strong>
          <p>{candidate.subtitle}</p>
        </div>
        <p className="scheduling-warning">
          Após confirmar, <strong>você não poderá mudar</strong> a unidade de saúde neste aparelho.
          Todos os agendamentos serão feitos neste PSF.
        </p>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => setCandidate(null)}>
            Escolher outro
          </button>
          <button type="button" onClick={confirmChoice}>
            Sim, está correto
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel scheduling-panel">
      <p className="eyebrow">Unidade de saúde</p>
      <h3>Em qual PSF você se consulta?</h3>
      <p className="scheduling-copy">Escolha a unidade onde você costuma ser atendido.</p>
      <div className="scheduling-psf-grid">
        {PSF_OPTIONS.map((psf) => (
          <button
            key={psf.id}
            type="button"
            className={`scheduling-psf-card ${psf.bookingEnabled ? '' : 'is-disabled'}`}
            onClick={() => psf.bookingEnabled && setCandidate(psf)}
            disabled={!psf.bookingEnabled}
          >
            <strong>{psf.label}</strong>
            <span>{psf.subtitle}</span>
            {!psf.bookingEnabled ? <small>Disponível em breve</small> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

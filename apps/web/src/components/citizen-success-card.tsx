'use client';

import { useState } from 'react';

type CitizenSuccessCardProps = {
  title: string;
  message: string;
  protocol?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function CitizenSuccessCard({
  title,
  message,
  protocol,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary
}: CitizenSuccessCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyProtocol() {
    if (!protocol) return;
    try {
      await navigator.clipboard.writeText(protocol);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="citizen-success-card" role="status" aria-live="polite">
      <div className="citizen-success-card__icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {protocol ? (
        <div className="citizen-success-card__protocol citizen-copyable">
          <span className="citizen-success-card__protocol-label">Protocolo</span>
          <strong>{protocol}</strong>
          <button type="button" className="citizen-success-card__copy" onClick={() => void copyProtocol()}>
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      ) : null}
      <div className="citizen-success-card__actions">
        <button type="button" className="btn-primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button type="button" className="btn-secondary" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';

type CitizenEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  onSecondary?: () => void;
  icon?: 'inbox' | 'wifi' | 'megaphone';
};

function EmptyIcon({ type }: { type: CitizenEmptyStateProps['icon'] }) {
  if (type === 'wifi') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9z" />
        <path d="M5 13l2 2c2.76-2.76 7.24-2.76 10 0l2-2c-3.87-3.87-10.13-3.87-14 0z" />
        <path d="M9 17l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="21" x2="12" y2="21.01" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'megaphone') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 11v2a4 4 0 004 4h1" />
        <path d="M7 9V7a4 4 0 014-4h0a4 4 0 014 4v10a4 4 0 01-4 4h0a4 4 0 01-4-4v-2" />
        <path d="M17 8l4-2v12l-4-2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}

export function CitizenEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondary,
  icon = 'inbox'
}: CitizenEmptyStateProps) {
  return (
    <section className="citizen-empty-state">
      <div className="citizen-empty-state__icon" aria-hidden>
        <EmptyIcon type={icon} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="citizen-empty-state__actions">
        {actionLabel && (actionHref || onAction) ? (
          actionHref ? (
            <Link href={actionHref} className="btn-primary citizen-empty-state__btn">
              {actionLabel}
            </Link>
          ) : (
            <button type="button" className="btn-primary citizen-empty-state__btn" onClick={onAction}>
              {actionLabel}
            </button>
          )
        ) : null}
        {secondaryLabel && (secondaryHref || onSecondary) ? (
          secondaryHref ? (
            <Link href={secondaryHref} className="btn-secondary citizen-empty-state__btn">
              {secondaryLabel}
            </Link>
          ) : (
            <button type="button" className="btn-secondary citizen-empty-state__btn" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}

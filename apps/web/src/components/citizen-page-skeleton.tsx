'use client';

type CitizenPageSkeletonProps = {
  variant?: 'feed' | 'form' | 'list';
};

export function CitizenPageSkeleton({ variant = 'list' }: CitizenPageSkeletonProps) {
  if (variant === 'feed') {
    return (
      <div className="citizen-skeleton" aria-busy="true" aria-label="Carregando conteúdo">
        <div className="citizen-skeleton__line citizen-skeleton__line--short" />
        <div className="citizen-skeleton__card">
          <div className="citizen-skeleton__block citizen-skeleton__block--image" />
          <div className="citizen-skeleton__line" />
          <div className="citizen-skeleton__line citizen-skeleton__line--medium" />
          <div className="citizen-skeleton__line citizen-skeleton__line--long" />
        </div>
        <div className="citizen-skeleton__card">
          <div className="citizen-skeleton__line" />
          <div className="citizen-skeleton__line citizen-skeleton__line--long" />
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="citizen-skeleton" aria-busy="true" aria-label="Carregando formulário">
        <div className="citizen-skeleton__stepper">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="citizen-skeleton__card">
          <div className="citizen-skeleton__line citizen-skeleton__line--short" />
          <div className="citizen-skeleton__field" />
          <div className="citizen-skeleton__field" />
          <div className="citizen-skeleton__field citizen-skeleton__field--tall" />
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-skeleton" aria-busy="true" aria-label="Carregando lista">
      <div className="citizen-skeleton__cards-row">
        <div className="citizen-skeleton__stat" />
        <div className="citizen-skeleton__stat" />
        <div className="citizen-skeleton__stat" />
      </div>
      <div className="citizen-skeleton__card">
        <div className="citizen-skeleton__line citizen-skeleton__line--short" />
        <div className="citizen-skeleton__line" />
        <div className="citizen-skeleton__line citizen-skeleton__line--long" />
      </div>
      <div className="citizen-skeleton__card">
        <div className="citizen-skeleton__line citizen-skeleton__line--short" />
        <div className="citizen-skeleton__line citizen-skeleton__line--long" />
      </div>
    </div>
  );
}

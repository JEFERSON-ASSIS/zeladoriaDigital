type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
  return (
    <div className={`brand-mark brand-mark--${size} ${className}`.trim()} aria-hidden="true">
      i7
    </div>
  );
}

type BrandLogoProps = {
  variant?: 'light' | 'dark' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
};

export function BrandLogo({
  variant = 'gradient',
  size = 'md',
  showTagline = false,
  className = ''
}: BrandLogoProps) {
  return (
    <div className={`brand-logo brand-logo--${variant} brand-logo--${size} ${className}`.trim()}>
      <BrandMark size={size} />
      <div className="brand-logo__text">
        <span className="brand-logo__name">
          <strong>i7AI</strong>
          <span className="brand-logo__suffix"> Sistemas</span>
        </span>
        {showTagline ? <span className="brand-logo__tagline">Inteligência artificial aplicada</span> : null}
      </div>
    </div>
  );
}

type ProductBadgeProps = {
  name?: string;
  description?: string;
  className?: string;
};

export function ProductBadge({
  name = 'Prefeitura na Mão',
  description,
  className = ''
}: ProductBadgeProps) {
  return (
    <div className={`product-badge ${className}`.trim()}>
      <span className="product-badge__label">Plataforma</span>
      <strong className="product-badge__name">{name}</strong>
      {description ? <p className="product-badge__desc">{description}</p> : null}
    </div>
  );
}

type CitizenProductLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tagline?: string;
};

export function CitizenProductLogo({
  size = 'md',
  className = '',
  tagline = 'Serviços ao cidadão'
}: CitizenProductLogoProps) {
  return (
    <div className={`citizen-product-logo citizen-product-logo--${size} ${className}`.trim()}>
      <BrandMark size={size} />
      <div className="citizen-product-logo__text">
        <strong className="citizen-product-logo__name">Prefeitura na Mão</strong>
        {tagline ? <span className="citizen-product-logo__tagline">{tagline}</span> : null}
      </div>
    </div>
  );
}

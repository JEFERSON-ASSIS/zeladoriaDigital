'use client';

type ConfirmDetail = {
  label: string;
  value: string;
};

type CitizenConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  details?: ConfirmDetail[];
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function CitizenConfirmDialog({
  open,
  title,
  description,
  details = [],
  warning,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  destructive = false,
  loading = false,
  onConfirm,
  onClose
}: CitizenConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="citizen-dialog-backdrop" onClick={loading ? undefined : onClose} role="presentation">
      <section
        className="citizen-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="citizen-dialog-title"
        aria-describedby="citizen-dialog-description"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="citizen-dialog__header">
          <div className={`citizen-dialog__icon ${destructive ? 'citizen-dialog__icon--danger' : ''}`} aria-hidden="true">
            {destructive ? '!' : '?'}
          </div>
          <div>
            <p className="eyebrow">{destructive ? 'Atenção' : 'Confirmação'}</p>
            <h3 id="citizen-dialog-title">{title}</h3>
          </div>
        </header>

        <p id="citizen-dialog-description" className="citizen-dialog__description">
          {description}
        </p>

        {details.length > 0 ? (
          <dl className="citizen-dialog__details">
            {details.map((item) => (
              <div key={item.label} className="citizen-dialog__detail-row">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {warning ? <p className="citizen-dialog__warning">{warning}</p> : null}

        <div className="citizen-dialog__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? 'citizen-dialog__confirm-danger' : ''}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

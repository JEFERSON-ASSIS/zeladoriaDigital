'use client';

export type GlobalFilters = {
  periodStart: string;
  periodEnd: string;
  departmentId: string;
  categoryId: string;
  neighborhoodId: string;
  status: string;
  priority: string;
  source: string;
};

type Props = {
  value: GlobalFilters;
  onChange: (next: GlobalFilters) => void;
};

const statusOptions = ['ABERTO', 'EM_ANALISE', 'ENCAMINHADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'];
const priorityOptions = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const sourceOptions = ['WEB', 'PWA', 'WHATSAPP', 'PRESENCIAL', 'INTERNO'];

export function GlobalFiltersBar({ value, onChange }: Props) {
  function updateField<K extends keyof GlobalFilters>(key: K, nextValue: GlobalFilters[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <div className="toolbar">
      <input type="date" value={value.periodStart} onChange={(e) => updateField('periodStart', e.target.value)} />
      <input type="date" value={value.periodEnd} onChange={(e) => updateField('periodEnd', e.target.value)} />
      <input placeholder="Secretaria" value={value.departmentId} onChange={(e) => updateField('departmentId', e.target.value)} />
      <input placeholder="Categoria" value={value.categoryId} onChange={(e) => updateField('categoryId', e.target.value)} />
      <input placeholder="Bairro" value={value.neighborhoodId} onChange={(e) => updateField('neighborhoodId', e.target.value)} />
      <select value={value.status} onChange={(e) => updateField('status', e.target.value)}>
        <option value="">Status</option>
        {statusOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <select value={value.priority} onChange={(e) => updateField('priority', e.target.value)}>
        <option value="">Prioridade</option>
        {priorityOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <select value={value.source} onChange={(e) => updateField('source', e.target.value)}>
        <option value="">Origem</option>
        {sourceOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}

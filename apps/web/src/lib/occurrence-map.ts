export const ACTIVE_OCCURRENCE_STATUSES = ['ABERTO', 'EM_ANALISE', 'ENCAMINHADO', 'EM_EXECUCAO'] as const;

export function isActiveOccurrenceForMap(status?: string) {
  return ACTIVE_OCCURRENCE_STATUSES.includes(status as (typeof ACTIVE_OCCURRENCE_STATUSES)[number]);
}

export const OCCURRENCE_STATUS_LABELS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em análise',
  ENCAMINHADO: 'Encaminhado',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado'
};

export const OCCURRENCE_STATUS_COLORS: Record<string, string> = {
  ABERTO: '#2563eb',
  EM_ANALISE: '#7c3aed',
  ENCAMINHADO: '#0891b2',
  EM_EXECUCAO: '#ea580c',
  CONCLUIDO: '#16a34a',
  CANCELADO: '#64748b'
};

export const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente'
};

export type OccurrenceMapPoint = {
  id: string;
  protocol?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  latitude: number;
  longitude: number;
  category?: { name?: string } | null;
  suggestedDepartment?: { name?: string } | null;
  neighborhood?: { name?: string } | null;
};

export function formatOccurrenceStatus(status?: string) {
  return OCCURRENCE_STATUS_LABELS[status ?? ''] ?? status ?? '—';
}

export function formatPriority(priority?: string) {
  return PRIORITY_LABELS[priority ?? ''] ?? priority ?? '—';
}

export function occurrencePopupHtml(item: OccurrenceMapPoint) {
  const status = formatOccurrenceStatus(item.status);
  const priority = formatPriority(item.priority);
  const category = item.category?.name ?? 'Sem categoria';
  const department = item.suggestedDepartment?.name ?? '—';
  const neighborhood = item.neighborhood?.name ?? '—';

  return `
    <div class="operational-popup">
      <strong>${item.protocol ?? item.id}</strong>
      <p>${item.title ?? item.description ?? 'Chamado'}</p>
      <ul>
        <li><span>Status</span> ${status}</li>
        <li><span>Prioridade</span> ${priority}</li>
        <li><span>Categoria</span> ${category}</li>
        <li><span>Secretaria</span> ${department}</li>
        <li><span>Bairro</span> ${neighborhood}</li>
      </ul>
    </div>
  `;
}

export function createPinElement(status?: string) {
  const color = OCCURRENCE_STATUS_COLORS[status ?? ''] ?? '#2563eb';
  const element = document.createElement('div');
  element.className = 'operational-pin';
  element.innerHTML = `<span style="background:${color}"></span>`;
  return element;
}

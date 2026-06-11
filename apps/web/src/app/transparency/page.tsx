'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicTransparency } from '../../lib/api';
import { GlobalFiltersBar, type GlobalFilters } from '../../components/global-filters';

export default function TransparencyPage() {
  const [filters, setFilters] = useState<GlobalFilters>({
    periodStart: '',
    periodEnd: '',
    departmentId: '',
    categoryId: '',
    neighborhoodId: '',
    status: '',
    priority: '',
    source: ''
  });
  const queryFilters = useMemo(() => filters, [filters]);
  const dashboard = useQuery({ queryKey: ['public-transparency', queryFilters], queryFn: () => fetchPublicTransparency(queryFilters) });
  const data = dashboard.data ?? {};

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Transparency</p>
        <h2>Portal de transparência</h2>
        <p>Sem exposição de dados pessoais sensíveis.</p>
      </header>
      <GlobalFiltersBar value={filters} onChange={setFilters} />
      <div className="metrics">
        <article className="metric"><span>Total de demandas</span><strong>{data.totalDemandas ?? 0}</strong></article>
        <article className="metric"><span>Concluídas</span><strong>{data.demandasConcluidas ?? 0}</strong></article>
        <article className="metric"><span>Tempo médio</span><strong>{data.tempoMedioHoras ?? 0}h</strong></article>
        <article className="metric"><span>Sigilo</span><strong>Ativo</strong></article>
      </div>
      <div className="two-col">
        <article className="chart-card">
          <h3>Categorias mais frequentes</h3>
          <ul className="rank-list">
            {(data.categoriasMaisFrequentes ?? []).map((item: any) => (
              <li className="list-item" key={item.label}>{item.label} - {item.value}</li>
            ))}
          </ul>
        </article>
        <article className="chart-card">
          <h3>Bairros mais atendidos</h3>
          <ul className="rank-list">
            {(data.bairrosMaisAtendidos ?? []).map((item: any) => (
              <li className="list-item" key={item.label}>{item.label} - {item.value}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

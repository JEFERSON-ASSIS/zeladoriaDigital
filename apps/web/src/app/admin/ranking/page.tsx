'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRanking } from '../../../lib/api';
import { GlobalFiltersBar, type GlobalFilters } from '../../../components/global-filters';

export default function RankingPage() {
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
  const ranking = useQuery({ queryKey: ['ranking', queryFilters], queryFn: () => fetchRanking(queryFilters) });

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Ranking</p>
        <h2>Ranking inteligente de ocorrências</h2>
      </header>
      <GlobalFiltersBar value={filters} onChange={setFilters} />
      <div className="rank-list">
        {(ranking.data ?? []).map((item: any, index: number) => (
          <article className="list-item" key={item.id ?? index}>
            <strong>#{index + 1} {item.classification ?? 'MEDIA'}</strong>
            <p>Score: {item.score ?? 0}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

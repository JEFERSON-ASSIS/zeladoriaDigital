'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '../../../lib/api';
import { GlobalFiltersBar, type GlobalFilters } from '../../../components/global-filters';

export default function AlertsPage() {
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
  const alerts = useQuery({ queryKey: ['alerts', filters], queryFn: () => fetchAlerts(filters) });

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Alerts</p>
        <h2>Alertas gerenciais</h2>
      </header>
      <GlobalFiltersBar value={filters} onChange={setFilters} />
      <div className="alert-list">
        {(alerts.data ?? []).map((item: any) => (
          <article className="list-item" key={item.id}>
            <span className="pill">{item.level}</span>
            <h3>{item.title}</h3>
            <p>{item.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

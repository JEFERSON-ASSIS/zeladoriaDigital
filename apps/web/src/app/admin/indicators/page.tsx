'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchCategoryIndicators, fetchDepartmentIndicators, fetchNeighborhoodIndicators, fetchStatusIndicators } from '../../../lib/api';
import { GlobalFiltersBar, type GlobalFilters } from '../../../components/global-filters';

export default function IndicatorsPage() {
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
  const status = useQuery({ queryKey: ['status-indicators', queryFilters], queryFn: () => fetchStatusIndicators(queryFilters) });
  const departments = useQuery({ queryKey: ['department-indicators', queryFilters], queryFn: () => fetchDepartmentIndicators(queryFilters) });
  const categories = useQuery({ queryKey: ['category-indicators', queryFilters], queryFn: () => fetchCategoryIndicators(queryFilters) });
  const neighborhoods = useQuery({ queryKey: ['neighborhood-indicators', queryFilters], queryFn: () => fetchNeighborhoodIndicators(queryFilters) });

  const statusData = (status.data ?? []).map((item: any) => ({ name: item.status, value: item.quantity }));

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Indicators</p>
        <h2>Indicadores por status, secretaria, categoria e bairro</h2>
      </header>
      <GlobalFiltersBar value={filters} onChange={setFilters} />
      <div className="two-col">
        <article className="chart-card">
          <h3>Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100}>
                {statusData.map((_, index) => <Cell key={index} fill={['#2563eb', '#0f766e', '#7c3aed', '#16a34a'][index % 4]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
        <article className="chart-card">
          <h3>Secretarias</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={(departments.data ?? []).slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="departmentName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalReceived" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </div>
      <div className="two-col">
        <article className="chart-card">
          <h3>Categorias</h3>
          <ul className="rank-list">
            {(categories.data ?? []).slice(0, 6).map((item: any) => <li className="list-item" key={item.category}>{item.category} - {item.quantity}</li>)}
          </ul>
        </article>
        <article className="chart-card">
          <h3>Bairros</h3>
          <ul className="rank-list">
            {(neighborhoods.data ?? []).slice(0, 6).map((item: any) => <li className="list-item" key={item.neighborhood}>{item.neighborhood} - {item.total}</li>)}
          </ul>
        </article>
      </div>
    </section>
  );
}

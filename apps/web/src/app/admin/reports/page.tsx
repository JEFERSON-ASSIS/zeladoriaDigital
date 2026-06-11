'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportAdminGrid, fetchReportsSummary } from '../../../lib/api';
import { GlobalFiltersBar, type GlobalFilters } from '../../../components/global-filters';

export default function ReportsPage() {
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
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('csv');
  const queryFilters = useMemo(() => filters, [filters]);

  const report = useQuery({
    queryKey: ['reports-summary', queryFilters],
    queryFn: () => fetchReportsSummary(queryFilters)
  });

  async function handleExport() {
    const result = await exportAdminGrid(exportFormat, filters);
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Reports</p>
        <h2>Relatórios gerenciais</h2>
      </header>
      <GlobalFiltersBar value={filters} onChange={setFilters} />
      <div className="toolbar">
        <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'xlsx')}>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="xlsx">XLSX</option>
        </select>
        <button type="button" onClick={handleExport}>Exportar grid filtrado</button>
      </div>
      <div className="report-list">
        <article className="list-item">Total: {String(report.data?.totalOccurrences ?? 0)}</article>
        <article className="list-item">Concluídas: {String(report.data?.completedOccurrences ?? 0)}</article>
        <article className="list-item">Resumo: {String(report.data?.executiveSummary ?? '')}</article>
      </div>
    </section>
  );
}

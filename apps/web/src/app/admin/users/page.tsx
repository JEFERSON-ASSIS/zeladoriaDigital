'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../../../lib/api';

export default function AdminUsersPage() {
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => fetchDashboardData() });

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Users</p>
        <h2>Usuários do sistema</h2>
        <p>Visão administrativa dos perfis cadastrados.</p>
      </header>
      <div className="rank-list">
        {(users.data?.users ?? []).map((item: any) => (
          <article className="list-item" key={item.id}>
            <strong>{item.name}</strong>
            <p>{item.email}</p>
            <span className="pill">{item.role}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

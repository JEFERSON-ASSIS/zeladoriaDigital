'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUsers, getStoredAccessToken } from '../../../lib/api';

export default function AdminUsersPage() {
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchUsers(getStoredAccessToken()),
    staleTime: 60_000
  });

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Usuários</p>
        <h2>Usuários do sistema</h2>
        <p>Visão administrativa dos perfis cadastrados.</p>
      </header>
      {users.isLoading ? <p>Carregando usuarios...</p> : null}
      <div className="rank-list">
        {(users.data ?? []).map((item: any) => (
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

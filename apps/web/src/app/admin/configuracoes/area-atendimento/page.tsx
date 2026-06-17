'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoredAccessToken } from '../../../../lib/api';

type ServiceArea = {
  id: string;
  nome: string;
  municipio: string;
  estado: string;
  raioMetros?: number | null;
  validacaoAtiva: boolean;
  bloquearForaDaArea: boolean;
  ativo: boolean;
};

async function fetchServiceAreas() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/admin/service-area`, {
    cache: 'no-store',
    headers: getStoredAccessToken() ? { Authorization: `Bearer ${getStoredAccessToken()}` } : {}
  });
  return response.ok ? (response.json() as Promise<ServiceArea[]>) : [];
}

export default function AreaAtendimentoPage() {
  const [token, setToken] = useState<string | undefined>();
  useEffect(() => {
    setToken(getStoredAccessToken());
  }, []);
  const query = useQuery({ queryKey: ['service-area'], queryFn: fetchServiceAreas, staleTime: 60_000 });
  const areas = query.data ?? [];
  const active = areas.find((area) => area.ativo) ?? areas[0];

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">Configuracoes</p>
        <h2>Area de atendimento geográfico</h2>
        <p>Cadastro da regiao atendida pela prefeitura, pronto para integrar mapa, validacao e bloqueio fora da area.</p>
      </header>

      {query.isLoading ? <p>Carregando area de atendimento...</p> : null}

      <div className="two-col">
        <article className="chart-card">
          <h3>Estado atual</h3>
          {active ? (
            <ul>
              <li>Municipio: {active.municipio}</li>
              <li>Estado: {active.estado}</li>
              <li>Raio: {active.raioMetros ?? 'nao definido'} m</li>
              <li>Validacao: {active.validacaoAtiva ? 'ativa' : 'inativa'}</li>
              <li>Bloqueio externo: {active.bloquearForaDaArea ? 'sim' : 'nao'}</li>
            </ul>
          ) : (
            <p>Nenhuma area cadastrada ainda.</p>
          )}
        </article>

        <article className="chart-card">
          <h3>Proximos passos</h3>
          <p>Conectar o desenho do poligono ao mapa operacional e usar o endpoint de validacao antes de salvar novas ocorrencias.</p>
          <p style={{ opacity: 0.75 }}>Sessao: {token ? 'autenticada' : 'nao carregada'}</p>
        </article>
      </div>
    </section>
  );
}

import type { UserRole } from './types';

export type MenuKey =
  | 'painel'
  | 'ocorrencias'
  | 'ordens-servico'
  | 'painel-executivo'
  | 'indicadores'
  | 'ranking'
  | 'relatorios'
  | 'alertas'
  | 'mapas'
  | 'configuracoes'
  | 'secretarias'
  | 'usuarios'
  | 'permissoes'
  | 'transparencia'
  | 'nova-ocorrencia'
  | 'minhas-solicitacoes'
  | 'agendamento'
  | 'meus-agendamentos';

export type MenuCatalogItem = {
  key: MenuKey;
  label: string;
  href: string;
  group: 'operacao' | 'gestao' | 'admin' | 'cidadao';
};

export const MENU_CATALOG: MenuCatalogItem[] = [
  { key: 'painel', label: 'Painel', href: '/', group: 'operacao' },
  { key: 'ocorrencias', label: 'Ocorrências', href: '/ocorrencias', group: 'operacao' },
  { key: 'ordens-servico', label: 'Ordens de serviço', href: '/ordens-servico', group: 'operacao' },
  { key: 'painel-executivo', label: 'Painel executivo', href: '/admin/dashboard/executivo', group: 'gestao' },
  { key: 'indicadores', label: 'Indicadores', href: '/admin/indicators', group: 'gestao' },
  { key: 'ranking', label: 'Ranking', href: '/admin/ranking', group: 'gestao' },
  { key: 'relatorios', label: 'Relatórios', href: '/admin/reports', group: 'gestao' },
  { key: 'alertas', label: 'Alertas', href: '/admin/alerts', group: 'gestao' },
  { key: 'mapas', label: 'Mapas', href: '/admin/maps/executive', group: 'gestao' },
  { key: 'configuracoes', label: 'Configurações', href: '/admin/configuracoes', group: 'admin' },
  { key: 'secretarias', label: 'Secretarias', href: '/admin/secretarias', group: 'admin' },
  { key: 'usuarios', label: 'Usuários', href: '/admin/users', group: 'admin' },
  { key: 'permissoes', label: 'Permissões', href: '/admin/permissoes', group: 'admin' },
  { key: 'transparencia', label: 'Transparência', href: '/transparency', group: 'gestao' },
  { key: 'nova-ocorrencia', label: 'Nova ocorrência', href: '/nova-ocorrencia', group: 'cidadao' },
  { key: 'minhas-solicitacoes', label: 'Minhas solicitações', href: '/minhas-solicitacoes', group: 'cidadao' },
  { key: 'agendamento', label: 'Agendar', href: '/agendamento', group: 'cidadao' },
  { key: 'meus-agendamentos', label: 'Meus agendamentos', href: '/meus-agendamentos', group: 'cidadao' }
];

const staffMenus: MenuKey[] = [
  'painel',
  'ocorrencias',
  'ordens-servico',
  'painel-executivo',
  'indicadores',
  'ranking',
  'relatorios',
  'alertas',
  'mapas',
  'transparencia'
];

export const DEFAULT_ROLE_MENU_KEYS: Record<
  Exclude<UserRole, 'TRIAGEM'>,
  MenuKey[]
> = {
  ADMIN: [...staffMenus, 'configuracoes', 'secretarias', 'usuarios', 'permissoes'],
  PREFEITURA: [...staffMenus],
  SECRETARIA: ['painel', 'ocorrencias', 'ordens-servico', 'alertas', 'mapas', 'usuarios'],
  EQUIPE_CAMPO: ['painel', 'ordens-servico'],
  CIDADAO: ['nova-ocorrencia', 'minhas-solicitacoes', 'agendamento', 'meus-agendamentos']
};

export const STAFF_ROLES: UserRole[] = ['ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO'];

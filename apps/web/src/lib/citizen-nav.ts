import type { MenuKey } from '@zeladoria/shared';
import { resolveCitizenPwaModules } from '@zeladoria/shared';
import { pwaPath } from './pwa';

export type CitizenNavItem = {
  key: string;
  label: string;
  href: string;
  iconKey: MenuKey | 'saude';
  matchPaths: string[];
};

const NAV_ORDER: Array<'inicio' | 'nova-ocorrencia' | 'minhas-solicitacoes' | 'saude'> = [
  'inicio',
  'nova-ocorrencia',
  'minhas-solicitacoes',
  'saude'
];

const UNIT_NAV_ORDER: Array<'inicio' | 'nova-ocorrencia' | 'minhas-solicitacoes' | 'agendamento' | 'meus-agendamentos'> = [
  'inicio',
  'nova-ocorrencia',
  'minhas-solicitacoes',
  'agendamento',
  'meus-agendamentos'
];

const UNIT_NAV_LABELS: Record<(typeof UNIT_NAV_ORDER)[number], string> = {
  inicio: 'Início',
  'nova-ocorrencia': 'Solicitar',
  'minhas-solicitacoes': 'Chamados',
  agendamento: 'Agendar',
  'meus-agendamentos': 'Consultas'
};

export function resolveCitizenNavItems(menuKeys: MenuKey[]): CitizenNavItem[] {
  const allowed = new Set(menuKeys);
  const modules = resolveCitizenPwaModules(menuKeys);
  const moduleMap = new Map(modules.map((module) => [module.key, module]));
  const items: CitizenNavItem[] = [];

  const hasAgendar = allowed.has('agendamento');
  const hasConsultas = allowed.has('meus-agendamentos');

  for (const key of NAV_ORDER) {
    if (key === 'saude') {
      if (hasAgendar && hasConsultas) {
        items.push({
          key: 'saude',
          label: 'Saúde',
          href: pwaPath('/saude'),
          iconKey: 'saude',
          matchPaths: [pwaPath('/saude'), pwaPath('/agendamento'), pwaPath('/meus-agendamentos')]
        });
      } else if (hasAgendar && moduleMap.has('agendamento')) {
        const module = moduleMap.get('agendamento')!;
        items.push({
          key: module.key,
          label: module.label,
          href: pwaPath(module.route),
          iconKey: module.key,
          matchPaths: [pwaPath(module.route)]
        });
      } else if (hasConsultas && moduleMap.has('meus-agendamentos')) {
        const module = moduleMap.get('meus-agendamentos')!;
        items.push({
          key: module.key,
          label: module.label,
          href: pwaPath(module.route),
          iconKey: module.key,
          matchPaths: [pwaPath(module.route)]
        });
      }
      continue;
    }

    const module = moduleMap.get(key);
    if (!module) continue;

    items.push({
      key: module.key,
      label: module.label,
      href: pwaPath(module.route),
      iconKey: module.key,
      matchPaths: [pwaPath(module.route)]
    });
  }

  return items;
}

export function resolveCitizenUnitNavItems(
  unit: { path: (segment?: string) => string; basePath: string },
  menuKeys: MenuKey[]
): CitizenNavItem[] {
  const allowed = new Set(menuKeys);
  const items: CitizenNavItem[] = [];

  for (const key of UNIT_NAV_ORDER) {
    if (!allowed.has(key)) continue;

    if (key === 'inicio') {
      items.push({
        key,
        label: UNIT_NAV_LABELS[key],
        href: unit.path(),
        iconKey: key,
        matchPaths: [unit.basePath, `${unit.basePath}/`]
      });
      continue;
    }

    if (key === 'agendamento') {
      const href = unit.path('/agendamento');
      items.push({
        key,
        label: UNIT_NAV_LABELS[key],
        href,
        iconKey: key,
        matchPaths: [href, `${href}/`]
      });
      continue;
    }

    if (key === 'meus-agendamentos') {
      const href = unit.path('/meus-agendamentos');
      items.push({
        key,
        label: UNIT_NAV_LABELS[key],
        href,
        iconKey: key,
        matchPaths: [href, `${href}/`]
      });
      continue;
    }

    const href = pwaPath(key === 'nova-ocorrencia' ? '/nova-ocorrencia' : '/minhas-solicitacoes');
    items.push({
      key,
      label: UNIT_NAV_LABELS[key],
      href,
      iconKey: key,
      matchPaths: [href, `${href}/`]
    });
  }

  return items;
}

export function isCitizenHealthPath(pathname: string) {
  return (
    pathname === pwaPath('/saude') ||
    pathname.startsWith(`${pwaPath('/saude')}/`) ||
    pathname === pwaPath('/agendamento') ||
    pathname.startsWith(`${pwaPath('/agendamento')}/`) ||
    pathname === pwaPath('/meus-agendamentos') ||
    pathname.startsWith(`${pwaPath('/meus-agendamentos')}/`)
  );
}

export function isNavPathActive(pathname: string, matchPaths: string[]) {
  return matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

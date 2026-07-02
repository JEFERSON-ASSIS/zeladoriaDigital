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

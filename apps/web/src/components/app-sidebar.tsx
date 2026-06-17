'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getRoleLabel } from '@zeladoria/shared';
import { BrandMark } from './brand-logo';
import { isNavItemActive } from '../lib/navigation';

export type SidebarNavItem = {
  label: string;
  href: string;
};

type AppSidebarProps = {
  items: SidebarNavItem[];
  userName?: string;
  userRole?: string;
  departmentName?: string;
  onLogout?: () => void;
};

export function AppSidebar({ items, userName, userRole, departmentName, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = (userName?.trim().charAt(0) ?? 'U').toUpperCase();
  const roleLabel = userRole ? getRoleLabel(userRole) : null;

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__header">
        <div className="app-sidebar__brand">
          <BrandMark size="md" className="app-sidebar__mark" />
          <div>
            <p className="app-sidebar__brand-name">
              <strong>i7AI</strong> Sistemas
            </p>
            <p className="app-sidebar__product">Zeladoria Digital</p>
          </div>
        </div>
      </div>

      {userName ? (
        <div className="app-sidebar__user">
          <div className="app-sidebar__avatar">{initial}</div>
          <div className="app-sidebar__user-info">
            <strong>{userName}</strong>
            {roleLabel ? <span>{roleLabel}</span> : null}
            {departmentName ? <span className="app-sidebar__department">{departmentName}</span> : null}
          </div>
        </div>
      ) : null}

      <nav className="app-sidebar__nav" aria-label="Menu principal">
        <span className="app-sidebar__nav-label">Menu</span>
        <ul className="app-sidebar__list">
          {items.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`app-sidebar__link${active ? ' app-sidebar__link--active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="app-sidebar__footer">
        {onLogout ? (
          <button type="button" className="app-sidebar__logout" onClick={onLogout}>
            Sair
          </button>
        ) : (
          <button type="button" className="app-sidebar__logout" onClick={() => router.push('/')}>
            Voltar ao painel
          </button>
        )}
        <p className="app-sidebar__credit">Powered by <strong>i7AI</strong></p>
      </div>
    </aside>
  );
}

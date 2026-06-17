import { SidebarShell } from '../../components/sidebar-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-layout">
      <SidebarShell />
      {children}
    </main>
  );
}

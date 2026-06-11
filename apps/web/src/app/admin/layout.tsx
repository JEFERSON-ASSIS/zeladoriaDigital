import Link from 'next/link';

const menu = [
  ['Executive Dashboard', '/admin/executive-dashboard'],
  ['Indicators', '/admin/indicators'],
  ['Ranking', '/admin/ranking'],
  ['Reports', '/admin/reports'],
  ['Alerts', '/admin/alerts'],
  ['Maps', '/admin/maps/executive'],
  ['Transparency', '/transparency']
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <h1>Zeladoria Digital</h1>
        <p>Gestão executiva e inteligência operacional</p>
        <nav>
          {menu.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
      </aside>
      {children}
    </main>
  );
}

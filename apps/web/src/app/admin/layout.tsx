import Link from 'next/link';

const menu = [
  ['Painel Executivo', '/admin/dashboard/executivo'],
  ['Indicadores', '/admin/indicators'],
  ['Ranking', '/admin/ranking'],
  ['Relatorios', '/admin/reports'],
  ['WhatsApp', '/admin/whatsapp'],
  ['Alertas', '/admin/alerts'],
  ['Area de Atendimento', '/admin/configuracoes/area-atendimento'],
  ['Mapas', '/admin/maps/executive'],
  ['Transparencia', '/transparency']
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <h1>Zeladoria Digital</h1>
        <p>Gestao executiva e inteligencia operacional</p>
        <nav>
          {menu.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      {children}
    </main>
  );
}

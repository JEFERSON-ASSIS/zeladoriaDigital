export const dynamic = 'force-dynamic';
export const revalidate = 0;

import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Zeladoria Digital',
  description: 'Plataforma municipal de zeladoria',
  manifest: '/manifest.json'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Zeladoria" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function (registrations) {
                        registrations.forEach(function (registration) {
                          registration.unregister();
                        });
                      });
                    }
                    if ('caches' in window) {
                      caches.keys().then(function (keys) {
                        keys.forEach(function (key) {
                          caches.delete(key);
                        });
                      });
                    }
                  }
                } catch (error) {}
              })();
            `
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root{--bg:#eef2f7;--sidebar:#0b1120;--primary:#2563eb;--secondary:#0f766e;--card:rgba(255,255,255,.92);--text:#0f172a}
              *{box-sizing:border-box}
              html,body{margin:0;min-height:100%;background:linear-gradient(180deg,#f7faff,var(--bg));color:var(--text);font-family:Arial,Helvetica,sans-serif}
              a{color:inherit;text-decoration:none}
              .login-shell{min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(180deg,#f7faff,var(--bg))}
              .login-card{width:min(480px,100%);background:rgba(255,255,255,.96);border:1px solid rgba(15,23,42,.08);border-radius:24px;padding:32px;box-shadow:0 14px 40px rgba(15,23,42,.12)}
              .login-copy{color:rgba(15,23,42,.7)}
              .login-form{display:grid;gap:16px;margin-top:24px}
              .login-form label{display:grid;gap:8px;font-weight:600}
              .login-form input{border:1px solid rgba(15,23,42,.15);border-radius:14px;padding:14px 16px;font:inherit}
              .login-form button{border:0;border-radius:14px;padding:14px 16px;background:var(--primary);color:white;font-weight:700;cursor:pointer}
              .login-error{margin:0;color:#b91c1c}
              .eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:var(--primary)}
              .shell{display:grid;grid-template-columns:280px 1fr;min-height:100vh}
              .sidebar{background:linear-gradient(180deg,#0b1120,#101a33);color:white;padding:32px}
              .sidebar nav{display:grid;gap:12px;margin-top:32px}
              .menu-link,.ghost-button{border:0;border-radius:12px;padding:12px 14px;cursor:pointer}
              .menu-link{background:rgba(255,255,255,.04);color:white;text-align:left}
              .ghost-button{margin-top:24px;width:100%;background:transparent;color:white;border:1px solid rgba(255,255,255,.2)}
              .content{padding:40px;display:grid;gap:24px}
              .hero,.card,.panel,.chart-card,.list-item,.metric,.admin-sidebar a{background:var(--card);border:1px solid rgba(15,23,42,.08);border-radius:20px;box-shadow:0 10px 30px rgba(15,23,42,.06)}
              .hero{padding:32px}
              .cards,.dashboard-grid,.two-col,.metrics{display:grid;gap:20px}
              .cards{grid-template-columns:repeat(3,minmax(0,1fr))}
              .card{padding:24px}
              .card strong{display:block;font-size:42px;margin-top:12px}
              .dashboard-grid,.two-col{grid-template-columns:repeat(2,minmax(0,1fr))}
              .panel{padding:20px}
              .panel-span-2{grid-column:span 2}
              .admin-layout{min-height:100vh;display:grid;grid-template-columns:300px 1fr}
              .admin-sidebar{background:linear-gradient(180deg,#0f172a,#111c38);color:white;padding:32px 24px}
              .admin-sidebar nav{display:grid;gap:10px;margin-top:24px}
              .admin-sidebar a{padding:10px 12px}
              .admin-shell{padding:32px;display:grid;gap:20px}
              .toolbar{display:flex;gap:12px;flex-wrap:wrap}
              .toolbar input,.toolbar select,.toolbar button{border:1px solid rgba(15,23,42,.12);border-radius:14px;padding:12px 14px;font:inherit;background:white}
              .toolbar button{background:var(--primary);color:white;font-weight:700}
              @media (max-width:900px){.shell,.admin-layout{grid-template-columns:1fr}.cards,.dashboard-grid,.two-col,.metrics{grid-template-columns:1fr}.panel-span-2{grid-column:auto}}
            `
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

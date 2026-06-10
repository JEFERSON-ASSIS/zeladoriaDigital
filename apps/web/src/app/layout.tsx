import './globals.css';

export const metadata = {
  title: 'Zeladoria Digital',
  description: 'Plataforma municipal de zeladoria'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

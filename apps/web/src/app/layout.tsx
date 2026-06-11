import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Zeladoria Digital',
  description: 'Plataforma municipal de zeladoria'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

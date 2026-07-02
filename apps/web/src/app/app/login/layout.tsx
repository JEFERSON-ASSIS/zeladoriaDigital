import { LoginPwaHead } from '../../../components/login-pwa-head';
import { PwaShell } from '../../../components/pwa-shell';

export default function LoginPwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="citizen-pwa-root">
      <LoginPwaHead />
      <PwaShell>{children}</PwaShell>
    </div>
  );
}

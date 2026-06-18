/** Exibe credenciais de teste na UI (homolog/dev). Em PRD, deixe false ou não defina. */
export function showDemoHints() {
  return process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === 'true';
}

function isLocalPreviewHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );
}

/** Pula a tela "Instale o app" — só em dev/LAN local (não usar NODE_ENV: quebra no build Docker). */
export function skipPwaInstallGate() {
  if (process.env.NEXT_PUBLIC_SKIP_PWA_INSTALL_GATE === 'true') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return isLocalPreviewHost(window.location.hostname);
}

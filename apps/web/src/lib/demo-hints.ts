/** Exibe credenciais de teste na UI (homolog/dev). Em PRD, deixe false ou não defina. */
export function showDemoHints() {
  return process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === 'true';
}

/** Pula a tela "Instale o app" — use em dev/LAN (HTTP não instala PWA no celular). */
export function skipPwaInstallGate() {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_SKIP_PWA_INSTALL_GATE === 'true'
  );
}

/** Exibe credenciais de teste na UI (homolog/dev). Em PRD, deixe false ou não defina. */
export function showDemoHints() {
  return process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === 'true';
}

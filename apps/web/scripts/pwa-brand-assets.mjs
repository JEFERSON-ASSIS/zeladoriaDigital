/** SVG compartilhado — ícone municipal “Prefeitura na Mão” (prédio + portal). */

export const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <path fill="#ffffff" d="M256 96 L392 188 V220 H120 V188 Z"/>
  <rect x="120" y="220" width="272" height="188" rx="12" fill="#ffffff"/>
  <rect x="208" y="296" width="96" height="112" rx="10" fill="#2563eb"/>
  <rect x="144" y="244" width="32" height="164" rx="8" fill="#dbeafe"/>
  <rect x="336" y="244" width="32" height="164" rx="8" fill="#dbeafe"/>
  <circle cx="256" cy="176" r="10" fill="#2563eb"/>
  <path fill="none" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" d="M176 432 Q256 468 336 432"/>
</svg>`;

/** Versão maskable — conteúdo dentro da zona segura (~80%). */
export const MASKABLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <path fill="#ffffff" d="M256 96 L392 188 V220 H120 V188 Z"/>
    <rect x="120" y="220" width="272" height="188" rx="12" fill="#ffffff"/>
    <rect x="208" y="296" width="96" height="112" rx="10" fill="#2563eb"/>
    <rect x="144" y="244" width="32" height="164" rx="8" fill="#dbeafe"/>
    <rect x="336" y="244" width="32" height="164" rx="8" fill="#dbeafe"/>
    <circle cx="256" cy="176" r="10" fill="#2563eb"/>
    <path fill="none" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" d="M176 432 Q256 468 336 432"/>
  </g>
</svg>`;

/** Silhueta branca para badge de notificação Android. */
export const NOTIFICATION_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <path fill="#ffffff" d="M48 14 L72 28 V36 H24 V28 Z"/>
  <rect x="24" y="36" width="48" height="38" rx="4" fill="#ffffff"/>
  <rect x="40" y="48" width="16" height="26" rx="3" fill="#ffffff"/>
</svg>`;

export const APP_NAME = 'Prefeitura na Mão';
export const APP_TAGLINE = 'Serviços ao cidadão';

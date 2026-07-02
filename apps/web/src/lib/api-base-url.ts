/**
 * URL da API no browser.
 * Em dev pelo celular (IP da rede), usa o mesmo host da página — evita IP antigo no bundle.
 */
export function getPublicApiUrl() {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (process.env.NODE_ENV === 'development' && !isLocalHost) {
      return `http://${hostname}:3333`;
    }

    if (protocol === 'https:' && isLocalHost) {
      return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
    }
  }

  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
}

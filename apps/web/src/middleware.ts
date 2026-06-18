import { NextRequest, NextResponse } from 'next/server';
import { PWA_CITIZEN_ROUTES } from './lib/pwa-constants';

const CLEANUP_COOKIE = 'zeladoria_dev_cleanup';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
  const alreadyCleaned = request.cookies.get(CLEANUP_COOKIE)?.value === '1';

  for (const route of PWA_CITIZEN_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = `/app${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  if (isLocalhost && !alreadyCleaned && (pathname === '/' || pathname === '/login')) {
    const response = NextResponse.next();
    response.headers.set('Clear-Site-Data', '"cache", "storage", "executionContexts"');
    response.cookies.set(CLEANUP_COOKIE, '1', {
      path: '/',
      sameSite: 'lax'
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/nova-ocorrencia/:path*',
    '/minhas-solicitacoes/:path*',
    '/agendamento/:path*',
    '/meus-agendamentos/:path*'
  ]
};

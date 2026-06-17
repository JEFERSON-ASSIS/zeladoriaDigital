import { NextRequest, NextResponse } from 'next/server';

const CLEANUP_COOKIE = 'zeladoria_dev_cleanup';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
  const alreadyCleaned = request.cookies.get(CLEANUP_COOKIE)?.value === '1';

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
  matcher: ['/', '/login']
};

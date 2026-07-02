import { getPsfById } from '../../../../../../lib/scheduling/psf-config';
import { isPsfId } from '../../../../../../lib/psf-unit';

const API_KEY = process.env.PSF_API_KEY ?? process.env.NEXT_PUBLIC_PSF_API_KEY ?? '';

type RouteContext = {
  params: { psfId: string; path: string[] };
};

async function proxyToPsfApi(request: Request, psfId: string, pathSegments: string[]) {
  if (!isPsfId(psfId)) {
    return Response.json({ message: 'Unidade inválida' }, { status: 404 });
  }

  const psf = getPsfById(psfId);
  if (!psf) {
    return Response.json({ message: 'Unidade não encontrada' }, { status: 404 });
  }

  const path = pathSegments.join('/');
  const incoming = new URL(request.url);
  const target = new URL(`${psf.baseUrl.replace(/\/$/, '')}/${path}`);

  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  if (API_KEY && !target.searchParams.has('api_key')) {
    target.searchParams.set('api_key', API_KEY);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(API_KEY ? { 'X-Api-Key': API_KEY } : {})
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(target.toString(), init);
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return Response.json(
      { message: `Não foi possível conectar à API de agendamento (${psf.baseUrl}).` },
      { status: 502 }
    );
  }
}

export async function GET(request: Request, context: RouteContext) {
  return proxyToPsfApi(request, context.params.psfId, context.params.path ?? []);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyToPsfApi(request, context.params.psfId, context.params.path ?? []);
}

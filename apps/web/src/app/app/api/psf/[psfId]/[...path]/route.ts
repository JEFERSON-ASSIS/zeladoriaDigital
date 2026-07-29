import { getPsfById } from '../../../../../../lib/scheduling/psf-config';
import { isPsfId } from '../../../../../../lib/psf-unit';

const API_KEY = process.env.PSF_API_KEY ?? process.env.NEXT_PUBLIC_PSF_API_KEY ?? '';

type RouteContext = {
  params: { psfId: string; path: string[] };
};

type CitizenAccount = {
  role?: string;
  phone?: string;
  healthUnitPsfId?: string | null;
};

const PWA_ACCOUNT_PATHS = new Set([
  'endpoints/agendamentos/listar_pwa_telefone.php',
  'endpoints/agendamentos/cancelar_pwa.php'
]);

function isPwaCreatePath(path: string) {
  return /^endpoints\/agendamentos\/criar(?:_medico_hora)?\.php$/.test(path);
}

async function getAuthenticatedCitizen(request: Request, psfId: string): Promise<CitizenAccount | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/me`, {
      headers: { Authorization: authorization },
      cache: 'no-store'
    });
    if (!response.ok) return null;

    const account = (await response.json()) as CitizenAccount;
    if (
      account.role !== 'CIDADAO' ||
      !account.phone ||
      (account.healthUnitPsfId && account.healthUnitPsfId !== psfId)
    ) {
      return null;
    }
    return account;
  } catch {
    return null;
  }
}

async function proxyToPsfApi(request: Request, psfId: string, pathSegments: string[]) {
  if (!isPsfId(psfId)) {
    return Response.json({ message: 'Unidade inválida' }, { status: 404 });
  }

  const psf = getPsfById(psfId);
  if (!psf) {
    return Response.json({ message: 'Unidade não encontrada' }, { status: 404 });
  }

  const path = pathSegments.join('/');
  const isCitizenPwaCreate = isPwaCreatePath(path) && request.headers.get('x-pwa-citizen-account') === '1';
  const accountProtected = PWA_ACCOUNT_PATHS.has(path) || isCitizenPwaCreate;
  const citizen = accountProtected ? await getAuthenticatedCitizen(request, psfId) : null;
  if (accountProtected && !citizen?.phone) {
    return Response.json({ message: 'Sessão do cidadão inválida ou expirada.' }, { status: 401 });
  }

  const incoming = new URL(request.url);
  const target = new URL(`${psf.baseUrl.replace(/\/$/, '')}/${path}`);

  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  if (API_KEY && !target.searchParams.has('api_key')) {
    target.searchParams.set('api_key', API_KEY);
  }
  if (PWA_ACCOUNT_PATHS.has(path) && citizen?.phone) {
    target.searchParams.set('telefone', citizen.phone);
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
    const bodyText = await request.text();
    if (isCitizenPwaCreate && citizen?.phone) {
      try {
        const body = JSON.parse(bodyText) as Record<string, unknown>;
        body.telefone = citizen.phone;
        init.body = JSON.stringify(body);
      } catch {
        return Response.json({ message: 'Dados do agendamento inválidos.' }, { status: 400 });
      }
    } else {
      init.body = bodyText;
    }
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

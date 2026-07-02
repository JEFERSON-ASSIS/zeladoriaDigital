import { buildUnitManifest, isPsfId } from '../../../../lib/psf-unit';

export async function GET(request: Request, context: { params: { psfId: string } }) {
  const psfId = context.params.psfId;
  if (!isPsfId(psfId)) {
    return new Response('Unidade não encontrada', { status: 404 });
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const manifest = buildUnitManifest(psfId, origin);

  if (!manifest) {
    return new Response('Unidade não encontrada', { status: 404 });
  }

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

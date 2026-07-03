import { buildCitizenManifest } from '../../../lib/pwa-manifest';
import { resolvePublicOrigin } from '../../../lib/public-origin';

export async function GET(request: Request) {
  const origin = resolvePublicOrigin(request);
  const manifest = buildCitizenManifest(origin);

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}

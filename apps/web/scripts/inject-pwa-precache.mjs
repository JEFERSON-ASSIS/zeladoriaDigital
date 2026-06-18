import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = join(webRoot, '.next');

const PWA_HTML_ROUTES = [
  '/app/login',
  '/app',
  '/app/nova-ocorrencia',
  '/app/minhas-solicitacoes',
  '/app/agendamento',
  '/app/meus-agendamentos',
  '/app/offline'
];

const STATIC_ROUTES = [
  '/app/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

function toPublicUrl(assetPath) {
  if (assetPath.startsWith('/')) return assetPath;
  return `/_next/${assetPath}`;
}

function collectPwaAssets(appManifest, buildManifest) {
  const assets = new Set();

  for (const [pageKey, files] of Object.entries(appManifest.pages ?? {})) {
    const isPwaPage = pageKey === '/layout' || pageKey.startsWith('/app/');
    if (!isPwaPage) continue;
    for (const file of files) {
      assets.add(toPublicUrl(file));
    }
  }

  for (const file of buildManifest.polyfillFiles ?? []) {
    assets.add(toPublicUrl(file));
  }
  for (const file of buildManifest.rootMainFiles ?? []) {
    assets.add(toPublicUrl(file));
  }
  for (const file of buildManifest.lowPriorityFiles ?? []) {
    assets.add(toPublicUrl(file));
  }

  return assets;
}

async function main() {
  const buildId = (await readFile(join(nextDir, 'BUILD_ID'), 'utf8')).trim();
  const appManifest = JSON.parse(await readFile(join(nextDir, 'app-build-manifest.json'), 'utf8'));
  const buildManifest = JSON.parse(await readFile(join(nextDir, 'build-manifest.json'), 'utf8'));

  const precache = [...STATIC_ROUTES, ...PWA_HTML_ROUTES, ...collectPwaAssets(appManifest, buildManifest)];
  const uniquePrecache = [...new Set(precache)];

  const template = await readFile(join(webRoot, 'public', 'app', 'sw.template.js'), 'utf8');
  const output = template
    .replace('__CACHE_VERSION__', `prefeitura-pwa-${buildId}`)
    .replace('__PRECACHE_JSON__', JSON.stringify(uniquePrecache, null, 2));

  await writeFile(join(webRoot, 'public', 'app', 'sw.js'), output, 'utf8');
  console.log(`PWA service worker gerado com ${uniquePrecache.length} URLs (build ${buildId})`);
}

main().catch((error) => {
  console.error('Falha ao gerar precache do PWA:', error);
  process.exit(1);
});

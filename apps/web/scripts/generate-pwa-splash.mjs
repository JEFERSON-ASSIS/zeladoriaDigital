import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { APP_ICON_SVG, APP_NAME, APP_TAGLINE } from './pwa-brand-assets.mjs';

const splashDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'app', 'splash');

const SPLASH_SCREENS = [
  { name: 'iphone-se', width: 750, height: 1334 },
  { name: 'iphone-xr', width: 828, height: 1792 },
  { name: 'iphone-12', width: 1170, height: 2532 },
  { name: 'iphone-14-pro-max', width: 1290, height: 2796 }
];

async function createSplash({ name, width, height }) {
  const logoSize = Math.round(Math.min(width, height) * 0.2);
  const logo = await sharp(Buffer.from(APP_ICON_SVG)).resize(logoSize, logoSize).png().toBuffer();
  const titleSize = Math.round(width * 0.065);
  const taglineSize = Math.round(width * 0.038);

  const labelSvg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${Math.round(height * 0.58)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="700" fill="#1e293b">${APP_NAME}</text>
    <text x="50%" y="${Math.round(height * 0.63)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${taglineSize}" fill="#64748b">${APP_TAGLINE}</text>
  </svg>`);

  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 242, g: 242, b: 247, alpha: 1 }
    }
  })
    .composite([
      { input: logo, top: Math.round(height * 0.32), left: Math.round((width - logoSize) / 2) },
      { input: labelSvg, top: 0, left: 0 }
    ])
    .png()
    .toBuffer();

  await writeFile(join(splashDir, `${name}.png`), buffer);
}

await mkdir(splashDir, { recursive: true });
await Promise.all(SPLASH_SCREENS.map(createSplash));
console.log(`PWA splash screens geradas em public/app/splash (${SPLASH_SCREENS.length} tamanhos)`);

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const splashDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'app', 'splash');

const SPLASH_SCREENS = [
  { name: 'iphone-se', width: 750, height: 1334 },
  { name: 'iphone-xr', width: 828, height: 1792 },
  { name: 'iphone-12', width: 1170, height: 2532 },
  { name: 'iphone-14-pro-max', width: 1290, height: 2796 }
];

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text x="256" y="330" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="200" font-weight="800">i7</text>
</svg>`;

async function createSplash({ name, width, height }) {
  const logoSize = Math.round(Math.min(width, height) * 0.22);
  const logo = await sharp(Buffer.from(logoSvg)).resize(logoSize, logoSize).png().toBuffer();

  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 242, g: 242, b: 247, alpha: 1 }
    }
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();

  await writeFile(join(splashDir, `${name}.png`), buffer);
}

await mkdir(splashDir, { recursive: true });
await Promise.all(SPLASH_SCREENS.map(createSplash));
console.log(`PWA splash screens geradas em public/app/splash (${SPLASH_SCREENS.length} tamanhos)`);

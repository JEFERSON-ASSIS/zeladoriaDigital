import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text x="256" y="330" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="200" font-weight="800">i7</text>
</svg>`;

await mkdir(root, { recursive: true });

for (const size of [192, 512]) {
  const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(join(root, `icon-${size}.png`), buffer);
}

const apple = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer();
await writeFile(join(root, 'apple-touch-icon.png'), apple);

console.log('PWA icons generated in public/icons');

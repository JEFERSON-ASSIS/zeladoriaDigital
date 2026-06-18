import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { APP_ICON_SVG, MASKABLE_ICON_SVG, NOTIFICATION_BADGE_SVG } from './pwa-brand-assets.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

await mkdir(root, { recursive: true });

for (const size of [192, 512]) {
  const buffer = await sharp(Buffer.from(APP_ICON_SVG)).resize(size, size).png().toBuffer();
  await writeFile(join(root, `icon-${size}.png`), buffer);
}

const maskable = await sharp(Buffer.from(MASKABLE_ICON_SVG)).resize(512, 512).png().toBuffer();
await writeFile(join(root, 'icon-512-maskable.png'), maskable);

const apple = await sharp(Buffer.from(APP_ICON_SVG)).resize(180, 180).png().toBuffer();
await writeFile(join(root, 'apple-touch-icon.png'), apple);

const notificationIcon = await sharp(Buffer.from(APP_ICON_SVG)).resize(192, 192).png().toBuffer();
await writeFile(join(root, 'notification-icon.png'), notificationIcon);

const notificationBadge = await sharp(Buffer.from(NOTIFICATION_BADGE_SVG)).resize(96, 96).png().toBuffer();
await writeFile(join(root, 'notification-badge.png'), notificationBadge);

console.log('PWA icons gerados (Prefeitura na Mão) em public/icons');

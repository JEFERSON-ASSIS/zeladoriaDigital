import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = join(webRoot, '..', '..');

function detectLanIp() {
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function loadRootEnv() {
  const envPath = join(monorepoRoot, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

const lanHost = process.env.LAN_DEV_HOST ?? detectLanIp();
const lanApiUrl = `http://${lanHost}:3333`;

const env = { ...process.env };
env.NODE_ENV = 'development';
// Sempre usa API na rede local — celular não alcança localhost nem IP antigo hardcoded.
env.NEXT_PUBLIC_API_URL = lanApiUrl;
env.LAN_DEV_HOST = lanHost;

console.log(`[dev-lan] Web:  http://${lanHost}:3000`);
console.log(`[dev-lan] API:  ${lanApiUrl}`);

const child = spawn('npm', ['exec', '--', 'next', 'dev', '-H', '0.0.0.0', '-p', '3000'], {
  cwd: webRoot,
  stdio: 'inherit',
  env,
  shell: true
});

child.on('exit', (code) => process.exit(code ?? 0));

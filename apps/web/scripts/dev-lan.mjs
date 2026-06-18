import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = join(webRoot, '..', '..');

const env = { ...process.env };
// .env da raiz do monorepo traz NODE_ENV=production e quebra o next dev.
env.NODE_ENV = 'development';
if (!env.NEXT_PUBLIC_API_URL) {
  env.NEXT_PUBLIC_API_URL = 'http://192.168.1.5:3333';
}

const child = spawn('npm', ['exec', '--', 'next', 'dev', '-H', '0.0.0.0', '-p', '3000'], {
  cwd: webRoot,
  stdio: 'inherit',
  env,
  shell: true
});

child.on('exit', (code) => process.exit(code ?? 0));

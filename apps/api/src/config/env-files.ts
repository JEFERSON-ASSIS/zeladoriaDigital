import { existsSync } from 'fs';
import { join } from 'path';

/** Carrega .env da raiz do monorepo quando a API roda em apps/api */
export function resolveEnvFilePaths(): string[] {
  const candidates = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '../.env'),
    join(process.cwd(), '../../.env'),
    join(__dirname, '../../../.env'),
    join(__dirname, '../../../../.env'),
    join(__dirname, '../../../../../.env')
  ];

  return [...new Set(candidates.filter((path) => existsSync(path)))];
}

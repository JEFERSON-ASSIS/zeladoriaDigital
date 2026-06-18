import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  CITIZEN_PWA_MODULES,
  DEFAULT_ROLE_MENU_KEYS,
  MENU_CATALOG,
  PERMISSION_MATRIX_ROLES,
  type MenuKey
} from '@zeladoria/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.purgeDeprecatedRoles();
      await this.ensureDefaults();
      await this.syncMissingDefaultMenuKeys();
    } catch (error) {
      console.warn('Permissions bootstrap skipped because Prisma is unavailable.');
      console.warn(error);
    }
  }

  private async purgeDeprecatedRoles() {
    await this.prisma.roleMenuPermission.deleteMany({
      where: { role: UserRole.TRIAGEM }
    });

    const legacyTriagemUsers = await this.prisma.user.findMany({
      where: {
        OR: [{ role: UserRole.TRIAGEM }, { email: 'triagem@zeladoria.local' }]
      },
      select: { id: true }
    });

    if (legacyTriagemUsers.length > 0) {
      const fallbackUser = await this.prisma.user.findFirst({
        where: { email: 'prefeitura@zeladoria.local' },
        select: { id: true }
      });

      for (const legacyUser of legacyTriagemUsers) {
        await this.prisma.occurrenceMovement.updateMany({
          where: { changedById: legacyUser.id },
          data: { changedById: fallbackUser?.id ?? null }
        });
        await this.prisma.user.delete({ where: { id: legacyUser.id } });
      }
    }
  }

  async ensureDefaults() {
    const count = await this.prisma.roleMenuPermission.count({
      where: { role: { in: PERMISSION_MATRIX_ROLES as UserRole[] } }
    });
    if (count > 0) return;

    const rows = PERMISSION_MATRIX_ROLES.flatMap((role) =>
      (DEFAULT_ROLE_MENU_KEYS[role as keyof typeof DEFAULT_ROLE_MENU_KEYS] ?? []).map((menuKey) => ({
        role: role as UserRole,
        menuKey,
        allowed: true
      }))
    );

    await this.prisma.roleMenuPermission.createMany({ data: rows, skipDuplicates: true });
  }

  /** Novos itens do catálogo entram automaticamente conforme DEFAULT_ROLE_MENU_KEYS */
  private async syncMissingDefaultMenuKeys() {
    for (const role of PERMISSION_MATRIX_ROLES) {
      const defaults = DEFAULT_ROLE_MENU_KEYS[role as keyof typeof DEFAULT_ROLE_MENU_KEYS] ?? [];
      if (!defaults.length) continue;

      const existing = await this.prisma.roleMenuPermission.findMany({
        where: { role: role as UserRole },
        select: { menuKey: true }
      });
      const existingKeys = new Set(existing.map((row) => row.menuKey));
      const missing = defaults.filter((menuKey) => !existingKeys.has(menuKey));
      if (!missing.length) continue;

      await this.prisma.roleMenuPermission.createMany({
        data: missing.map((menuKey) => ({
          role: role as UserRole,
          menuKey,
          allowed: true
        })),
        skipDuplicates: true
      });
    }
  }

  getCatalog() {
    return MENU_CATALOG;
  }

  async getMenuKeysForRole(role: UserRole): Promise<MenuKey[]> {
    if (role === UserRole.TRIAGEM) {
      return DEFAULT_ROLE_MENU_KEYS.PREFEITURA ?? [];
    }

    const rows = await this.prisma.roleMenuPermission.findMany({
      where: { role },
      select: { menuKey: true, allowed: true }
    });

    if (rows.length === 0) {
      return DEFAULT_ROLE_MENU_KEYS[role as keyof typeof DEFAULT_ROLE_MENU_KEYS] ?? [];
    }

    const allowedKeys = rows.filter((row) => row.allowed).map((row) => row.menuKey as MenuKey);

    if (role === UserRole.CIDADAO) {
      const pwaKeys = new Set<string>(CITIZEN_PWA_MODULES.map((module) => module.key));
      return allowedKeys.filter((key) => pwaKeys.has(key));
    }

    return allowedKeys;
  }

  async getMatrix() {
    const rows = await this.prisma.roleMenuPermission.findMany({
      where: { role: { in: PERMISSION_MATRIX_ROLES as UserRole[] } }
    });

    const matrix: Record<string, Record<string, boolean>> = {};

    for (const role of PERMISSION_MATRIX_ROLES) {
      matrix[role] = {};
      const defaults = DEFAULT_ROLE_MENU_KEYS[role as keyof typeof DEFAULT_ROLE_MENU_KEYS] ?? [];
      for (const item of MENU_CATALOG) {
        matrix[role][item.key] = defaults.includes(item.key);
      }
    }

    for (const row of rows) {
      if (!matrix[row.role]) continue;
      matrix[row.role][row.menuKey] = row.allowed;
    }

    return {
      catalog: MENU_CATALOG,
      roles: [...PERMISSION_MATRIX_ROLES],
      matrix
    };
  }

  async updateMatrix(payload: Record<string, Record<string, boolean>>) {
    const operations = [];

    for (const role of PERMISSION_MATRIX_ROLES) {
      const menus = payload[role];
      if (!menus) continue;

      for (const [menuKey, allowed] of Object.entries(menus)) {
        operations.push(
          this.prisma.roleMenuPermission.upsert({
            where: {
              role_menuKey: {
                role: role as UserRole,
                menuKey
              }
            },
            create: {
              role: role as UserRole,
              menuKey,
              allowed
            },
            update: { allowed }
          })
        );
      }
    }

    await this.prisma.$transaction(operations);
    return this.getMatrix();
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
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

  getCatalog() {
    return MENU_CATALOG;
  }

  async getMenuKeysForRole(role: UserRole): Promise<MenuKey[]> {
    if (role === UserRole.TRIAGEM) {
      return DEFAULT_ROLE_MENU_KEYS.PREFEITURA ?? [];
    }

    const rows = await this.prisma.roleMenuPermission.findMany({
      where: { role, allowed: true },
      select: { menuKey: true }
    });

    if (rows.length === 0) {
      return DEFAULT_ROLE_MENU_KEYS[role as keyof typeof DEFAULT_ROLE_MENU_KEYS] ?? [];
    }

    return rows.map((row) => row.menuKey as MenuKey);
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

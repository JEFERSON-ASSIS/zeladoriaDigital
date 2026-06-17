import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserDepartmentId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });
    return user?.departmentId ?? null;
  }

  async occurrenceScopeForUser(user: { sub: string; role: UserRole }): Promise<Prisma.OccurrenceWhereInput> {
    if (['ADMIN', 'PREFEITURA', 'TRIAGEM'].includes(user.role)) {
      return {};
    }

    if (user.role === UserRole.SECRETARIA || user.role === UserRole.EQUIPE_CAMPO) {
      const departmentId = await this.getUserDepartmentId(user.sub);
      if (!departmentId) {
        return { id: '__none__' };
      }
      return {
        OR: [
          { suggestedDepartmentId: departmentId },
          { serviceOrders: { some: { departmentId } } }
        ]
      };
    }

    return { id: '__none__' };
  }

  async userScopeForUser(user: { sub: string; role: UserRole }): Promise<Prisma.UserWhereInput> {
    if (['ADMIN', 'PREFEITURA', 'TRIAGEM'].includes(user.role)) {
      return {};
    }

    if (user.role === UserRole.SECRETARIA) {
      const departmentId = await this.getUserDepartmentId(user.sub);
      if (!departmentId) {
        return { id: '__none__' };
      }
      return { departmentId };
    }

    return { id: '__none__' };
  }

  async assertOccurrenceAccess(user: { sub: string; role: UserRole }, occurrenceId: string) {
    const scope = await this.occurrenceScopeForUser(user);
    if (Object.keys(scope).length === 0) return;

    const allowed = await this.prisma.occurrence.findFirst({
      where: { AND: [{ id: occurrenceId }, scope] },
      select: { id: true }
    });

    if (!allowed) {
      throw new ForbiddenException('Você não tem acesso a esta demanda da secretaria.');
    }
  }

  async assertServiceOrderAccess(user: { sub: string; role: UserRole }, serviceOrderId: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { occurrenceId: true }
    });
    if (!order) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }
    await this.assertOccurrenceAccess(user, order.occurrenceId);
  }
}

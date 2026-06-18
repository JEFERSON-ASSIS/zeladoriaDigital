import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CitizensService } from '../citizens/citizens.service';
import { PermissionsService } from '../permissions/permissions.service';
import { UserRole } from '@prisma/client';
import { isValidCitizenCpf, normalizeCitizenCpf, normalizeCitizenPhone } from '../citizens/citizen-identifiers';

const DEV_ACCOUNTS = [
  { id: 'dev-admin', name: 'Administrador', email: 'admin@zeladoria.local', password: 'secret123', role: UserRole.ADMIN },
  { id: 'dev-prefeitura', name: 'Atendimento Prefeitura', email: 'prefeitura@zeladoria.local', password: 'secret123', role: UserRole.PREFEITURA },
  { id: 'dev-secretaria', name: 'Admin secretaria — Obras', email: 'secretaria@zeladoria.local', password: 'secret123', role: UserRole.SECRETARIA },
  { id: 'dev-equipe', name: 'Usuário secretaria — Obras', email: 'equipe@zeladoria.local', password: 'secret123', role: UserRole.EQUIPE_CAMPO },
  { id: 'dev-cidadao', name: 'Cidadão Demo', email: 'cidadao@zeladoria.local', password: 'secret123', role: UserRole.CIDADAO }
] as const;

function isDevAuthFallbackEnabled() {
  return (
    process.env.ENABLE_DEMO_AUTH === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.DISABLE_DEV_AUTH !== 'true')
  );
}

function matchDevStaffAccount(email: string, password: string) {
  if (!isDevAuthFallbackEnabled()) return null;
  const fallback = DEV_ACCOUNTS.find((account) => account.email === email && account.role !== UserRole.CIDADAO);
  return fallback && fallback.password === password ? fallback : null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly citizensService: CitizensService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService
  ) {}

  async validateUser(email: string, password: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user) {
        const ok = await bcrypt.compare(password, user.password);
        if (ok) return user;
      }
    } catch {
      // Prisma indisponível — tenta fallback abaixo.
    }

    return matchDevStaffAccount(email, password);
  }

  async validateCitizen(email: string, password: string) {
    try {
      const citizen = await this.citizensService.findByEmail(email);
      if (citizen?.password) {
        const ok = await bcrypt.compare(password, citizen.password);
        if (ok) return citizen;
      }
    } catch {
      // Prisma indisponível — tenta fallback abaixo.
    }

    if (!isDevAuthFallbackEnabled()) return null;
    const fallback = DEV_ACCOUNTS.find((account) => account.email === email && account.role === UserRole.CIDADAO);
    return fallback && fallback.password === password ? fallback : null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const citizen = user ? null : await this.validateCitizen(email, password);
    const account = user ?? citizen;
    if (!account) throw new UnauthorizedException('Credenciais inválidas');
    return this.issueToken(account);
  }

  async citizenAccess(phone: string, cpf: string, lgpdAccepted: boolean) {
    const normalizedPhone = normalizeCitizenPhone(phone);
    const normalizedCpf = normalizeCitizenCpf(cpf);

    if (!isValidCitizenCpf(normalizedCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    let citizen = await this.citizensService.findByCpf(normalizedCpf);

    if (citizen) {
      const storedPhone = citizen.phone ? normalizeCitizenPhone(citizen.phone) : '';
      if (storedPhone !== normalizedPhone) {
        throw new UnauthorizedException('CPF ou celular incorretos');
      }
    } else {
      if (!lgpdAccepted) {
        throw new BadRequestException('É necessário aceitar os termos de privacidade');
      }
      citizen = await this.citizensService.registerAccess(normalizedPhone, normalizedCpf);
    }

    if (!citizen.lgpdAcceptedAt) {
      if (!lgpdAccepted) {
        throw new BadRequestException('É necessário aceitar os termos de privacidade');
      }
      citizen = await this.citizensService.acceptLgpd(citizen.id);
    }

    return this.issueToken({ ...citizen, role: 'CIDADAO' as const });
  }

  private async issueToken(account: { id: string; name: string; email?: string | null; role?: UserRole }) {
    const normalizedUser = 'role' in account && account.role
      ? account
      : {
          ...account,
          role: 'CIDADAO' as const
        };
    const payload = {
      sub: normalizedUser.id,
      role: normalizedUser.role,
      email: normalizedUser.email ?? ''
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: normalizedUser
    };
  }

  async me(userId: string, role: UserRole) {
    if (role === UserRole.CIDADAO) {
      const menuKeys = await this.permissionsService.getMenuKeysForRole(UserRole.CIDADAO);

      try {
        const citizen = await this.citizensService.findById(userId);
        if (!citizen) throw new UnauthorizedException('Sessão inválida');
        return {
          id: citizen.id,
          name: citizen.name,
          email: citizen.email ?? '',
          phone: citizen.phone ?? '',
          cpf: citizen.cpf ?? '',
          lgpdAcceptedAt: citizen.lgpdAcceptedAt,
          role: UserRole.CIDADAO,
          menuKeys
        };
      } catch {
        if (!isDevAuthFallbackEnabled()) throw new UnauthorizedException('Sessão inválida');
        const fallback = DEV_ACCOUNTS.find((account) => account.id === userId && account.role === UserRole.CIDADAO);
        if (!fallback) throw new UnauthorizedException('Sessão inválida');
        return {
          id: fallback.id,
          name: fallback.name,
          email: fallback.email,
          role: UserRole.CIDADAO,
          menuKeys
        };
      }
    }

    try {
      const user = await this.usersService.findById(userId);
      if (!user) throw new UnauthorizedException('Sessão inválida');
      const menuKeys = await this.permissionsService.getMenuKeysForRole(user.role);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department ? { id: user.department.id, name: user.department.name } : null,
        menuKeys
      };
    } catch {
      if (!isDevAuthFallbackEnabled()) throw new UnauthorizedException('Sessão inválida');
      const fallback = DEV_ACCOUNTS.find((account) => account.id === userId && account.role === role);
      if (!fallback) throw new UnauthorizedException('Sessão inválida');
      const menuKeys = await this.permissionsService.getMenuKeysForRole(fallback.role);
      return {
        id: fallback.id,
        name: fallback.name,
        email: fallback.email,
        role: fallback.role,
        departmentId: null,
        department: null,
        menuKeys
      };
    }
  }
}

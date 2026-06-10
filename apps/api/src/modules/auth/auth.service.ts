import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CitizensService } from '../citizens/citizens.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly citizensService: CitizensService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return user;
  }

  async validateCitizen(email: string, password: string) {
    const citizen = await this.citizensService.findByEmail(email);
    if (!citizen?.password) return null;
    const ok = await bcrypt.compare(password, citizen.password);
    if (!ok) return null;
    return citizen;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const citizen = user ? null : await this.validateCitizen(email, password);
    const account = user ?? citizen;
    if (!account) throw new UnauthorizedException('Credenciais inválidas');
    const normalizedUser = 'role' in account
      ? account
      : {
          ...account,
          role: 'CIDADAO' as const
        };
    const payload = {
      sub: normalizedUser.id,
      role: normalizedUser.role,
      email: normalizedUser.email
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: normalizedUser
    };
  }

  async me(userId: string, role: UserRole) {
    if (role === UserRole.CIDADAO) {
      const citizen = await this.citizensService.findById(userId);
      if (!citizen) throw new UnauthorizedException('Sessão inválida');
      return {
        id: citizen.id,
        name: citizen.name,
        email: citizen.email ?? '',
        role: UserRole.CIDADAO
      };
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Sessão inválida');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}

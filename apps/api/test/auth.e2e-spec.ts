import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { CitizensService } from '../src/modules/citizens/citizens.service';

describe('AuthService', () => {
  it('should return a token for valid credentials', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'user-1',
        role: 'ADMIN',
        email: 'admin@zeladoria.local',
        password: '$2a$10$Xw0G5V9Wm4gQwQ6YxQKZ9u3gHcQv5sF1qJx7xLw5jvQ5oQYgH6xTy'
      })
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token')
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: CitizensService, useValue: { findByEmail: jest.fn().mockResolvedValue(null) } },
        { provide: JwtService, useValue: jwtService }
      ]
    })
      .compile();

    const service = moduleRef.get(AuthService);
    jest.spyOn(service as any, 'validateUser').mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
      email: 'admin@zeladoria.local'
    });

    const result = await service.login('admin@zeladoria.local', 'secret123');

    expect(result.access_token).toBe('signed-token');
    expect(result.user.email).toBe('admin@zeladoria.local');
  });

  it('should reject invalid credentials', async () => {
    const service = new AuthService(
      { findByEmail: jest.fn().mockResolvedValue(null) } as any,
      { findByEmail: jest.fn().mockResolvedValue(null) } as any,
      { signAsync: jest.fn() } as any
    );

    await expect(service.login('bad@zeladoria.local', 'wrong')).rejects.toThrow('Credenciais inválidas');
  });

  it('should allow citizen login', async () => {
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token')
    };
    const service = new AuthService(
      { findByEmail: jest.fn().mockResolvedValue(null) } as any,
      {
        findByEmail: jest.fn().mockResolvedValue({
          id: 'cit-1',
          name: 'Cidadão Demo',
          email: 'cidadao@zeladoria.local',
          password: '$2a$10$Xw0G5V9Wm4gQwQ6YxQKZ9u3gHcQv5sF1qJx7xLw5jvQ5oQYgH6xTy'
        })
      } as any,
      jwtService as any
    );

    jest.spyOn(service as any, 'validateUser').mockResolvedValue(null);
    jest.spyOn(service as any, 'validateCitizen').mockResolvedValue({
      id: 'cit-1',
      name: 'Cidadão Demo',
      email: 'cidadao@zeladoria.local',
      role: 'CIDADAO'
    });

    const result = await service.login('cidadao@zeladoria.local', 'secret123');

    expect(result.access_token).toBe('signed-token');
    expect(result.user.role).toBe('CIDADAO');
  });
});

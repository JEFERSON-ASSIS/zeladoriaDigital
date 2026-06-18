import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CitizenAccessDto, CitizenPhoneLookupDto } from './dto/citizen-access.dto';
import { Public } from './public.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('citizen/lookup')
  citizenLookup(@Body() body: CitizenPhoneLookupDto) {
    return this.authService.citizenPhoneLookup(body.phone);
  }

  @Public()
  @Post('citizen/access')
  citizenAccess(@Body() body: CitizenAccessDto) {
    return this.authService.citizenAccess(body.phone, body.cpf, body.lgpdAccepted ?? false);
  }

  @Get('me')
  me(@Req() req: { user: { sub: string; role: UserRole } }) {
    return this.authService.me(req.user.sub, req.user.role);
  }
}

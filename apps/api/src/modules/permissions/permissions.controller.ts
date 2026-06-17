import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { PermissionsService } from './permissions.service';

@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('menus/me')
  getMyMenus(@Req() req: { user: { role: UserRole } }) {
    return this.permissionsService.getMenuKeysForRole(req.user.role);
  }

  @Get('menus')
  @Roles('ADMIN')
  getMatrix() {
    return this.permissionsService.getMatrix();
  }

  @Put('menus')
  @Roles('ADMIN')
  updateMatrix(@Body() body: Record<string, Record<string, boolean>>) {
    return this.permissionsService.updateMatrix(body);
  }
}

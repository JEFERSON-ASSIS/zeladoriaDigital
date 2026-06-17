import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'SECRETARIA')
  findAll(@Req() req: { user: { sub: string; role: UserRole } }) {
    if (req.user.role === UserRole.SECRETARIA) {
      return this.usersService.findAllForUser(req.user);
    }
    return this.usersService.findAll();
  }

  @Post()
  @Roles('ADMIN', 'SECRETARIA')
  create(@Body() body: CreateUserDto, @Req() req: { user: { sub: string; role: UserRole } }) {
    if (req.user.role === UserRole.SECRETARIA) {
      return this.usersService.createForDepartmentAdmin(body, req.user);
    }
    return this.usersService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SECRETARIA')
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Req() req: { user: { sub: string; role: UserRole } }
  ) {
    if (req.user.role === UserRole.SECRETARIA) {
      return this.usersService.updateForDepartmentAdmin(id, body, req.user);
    }
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SECRETARIA')
  remove(@Param('id') id: string, @Req() req: { user: { sub: string; role: UserRole } }) {
    if (req.user.role === UserRole.SECRETARIA) {
      return this.usersService.removeForDepartmentAdmin(id, req.user);
    }
    return this.usersService.remove(id);
  }
}

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CitizensService } from './citizens.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { isHealthUnitPsfId, type HealthUnitPsfId } from '@zeladoria/shared';

@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'PREFEITURA')
  findAll(@Query('healthUnitPsfId') healthUnitPsfId?: string) {
    if (healthUnitPsfId && !isHealthUnitPsfId(healthUnitPsfId)) {
      throw new BadRequestException('Unidade de saúde inválida');
    }
    return this.citizensService.findAll(healthUnitPsfId as HealthUnitPsfId | undefined);
  }

  @Public()
  @Post()
  create(@Body() body: CreateCitizenDto) {
    return this.citizensService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'PREFEITURA')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCitizenDto) {
    return this.citizensService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citizensService.remove(id);
  }
}

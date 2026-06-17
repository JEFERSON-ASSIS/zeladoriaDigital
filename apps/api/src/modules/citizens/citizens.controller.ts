import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CitizensService } from './citizens.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM')
  findAll() {
    return this.citizensService.findAll();
  }

  @Public()
  @Post()
  create(@Body() body: CreateCitizenDto) {
    return this.citizensService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM')
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

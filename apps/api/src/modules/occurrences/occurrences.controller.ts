import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { extensionForMime, isAllowedAttachment } from './attachment.utils';
@UseGuards(JwtAuthGuard)
@Controller('occurrences')
export class OccurrencesController {
  constructor(private readonly occurrencesService: OccurrencesService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO')
  findAll(@Req() req: { user: { sub: string; role: UserRole } }) {
    return this.occurrencesService.findAllForUser(req.user);
  }

  @Get('mine')
  @Roles('CIDADAO')
  findMine(@Req() req: { user: { sub: string } }) {
    return this.occurrencesService.findByCitizen(req.user.sub);
  }

  @Get('protocol/:protocol')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO')
  findByProtocol(@Param('protocol') protocol: string) {
    return this.occurrencesService.findByProtocol(protocol);
  }

  @Post()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'CIDADAO')
  create(@Body() body: CreateOccurrenceDto, @Req() req: { user: { sub: string; role: UserRole } }) {
    if (req.user.role === UserRole.CIDADAO) {
      body.citizenId = req.user.sub;
    }
    return this.occurrencesService.create(body);
  }

  @Post(':id/attachments')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'CIDADAO')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!isAllowedAttachment(file.mimetype)) {
          callback(new BadRequestException('Envie apenas fotos ou áudio.'), false);
          return;
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: (req, _file, callback) => {
          const occurrenceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
          const dir = join(process.cwd(), 'uploads', 'occurrences', occurrenceId);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          callback(null, dir);
        },
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname) || extensionForMime(file.mimetype) || '';
          callback(null, `${randomUUID()}${extension}`);
        }
      })
    })
  )
  addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: { sub: string; role: UserRole } }
  ) {
    return this.occurrencesService.addAttachment(id, file, req.user);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO')
  update(
    @Param('id') id: string,
    @Body() body: UpdateOccurrenceDto,
    @Req() req: { user: { sub: string; role: UserRole } }
  ) {
    return this.occurrencesService.update(id, body, req.user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.occurrencesService.remove(id);
  }

  @Patch('service-orders/:id/start')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO')
  startServiceOrder(@Param('id') id: string, @Req() req: { user: { sub: string; role: UserRole } }) {
    return this.occurrencesService.startServiceOrder(id, req.user);
  }

  @Patch('service-orders/:id/execution')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO')
  registerServiceOrderExecution(
    @Param('id') id: string,
    @Body() body: { teamNote?: string; beforePhotoUrl?: string; afterPhotoUrl?: string },
    @Req() req: { user: { sub: string; role: UserRole } }
  ) {
    return this.occurrencesService.registerServiceOrderExecution(id, body, req.user);
  }

  @Patch('service-orders/:id/finish')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO')
  finishServiceOrder(
    @Param('id') id: string,
    @Body() body: { teamNote?: string; afterPhotoUrl?: string },
    @Req() req: { user: { sub: string; role: UserRole } }
  ) {
    return this.occurrencesService.finishServiceOrder(id, body, req.user);
  }
}

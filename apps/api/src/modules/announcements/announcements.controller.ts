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
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AnnouncementsService } from './announcements.service';
import {
  CreateAnnouncementDto,
  PublishAnnouncementDto,
  SubscribeCitizenPushDto,
  UpdateAnnouncementDto
} from './dto/announcement.dto';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get('push-status')
  @Roles('ADMIN', 'PREFEITURA')
  pushStatus() {
    return this.service.getPushStatus();
  }

  @Get('feed')
  @Roles('CIDADAO', 'ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO')
  feed() {
    return this.service.findFeed();
  }

  @Get()
  @Roles('ADMIN', 'PREFEITURA')
  findAll() {
    return this.service.findAllAdmin();
  }

  @Post('push/subscribe')
  @Roles('CIDADAO')
  subscribePush(@Body() body: SubscribeCitizenPushDto, @Req() req: { user: { sub: string } }) {
    return this.service.subscribePush(req.user.sub, body);
  }

  @Post('upload-image')
  @Roles('ADMIN', 'PREFEITURA')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!IMAGE_MIMES.has(file.mimetype)) {
          callback(new BadRequestException('Envie apenas imagens (JPG, PNG, WEBP ou GIF).'), false);
          return;
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const dir = join(process.cwd(), 'uploads', 'announcements');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          callback(null, dir);
        },
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname) || '.jpg';
          callback(null, `${randomUUID()}${extension}`);
        }
      })
    })
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    return { imageUrl: this.service.buildImagePath(file.filename) };
  }

  @Post()
  @Roles('ADMIN', 'PREFEITURA')
  create(@Body() body: CreateAnnouncementDto, @Req() req: { user: { sub: string } }) {
    return this.service.create(body, req.user.sub);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PREFEITURA')
  update(@Param('id') id: string, @Body() body: UpdateAnnouncementDto) {
    return this.service.update(id, body);
  }

  @Post(':id/publish')
  @Roles('ADMIN', 'PREFEITURA')
  publish(@Param('id') id: string, @Body() body: PublishAnnouncementDto) {
    return this.service.publish(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PREFEITURA')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

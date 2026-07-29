import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupportConversationStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { SupportChatGateway } from './support-chat.gateway';
import { SupportChatService } from './support-chat.service';
import { Roles } from '../auth/roles.decorator';

type RequestActor = { user: { sub: string; role: UserRole } };

@Controller('support-chat')
@Roles('ADMIN', 'PREFEITURA', 'CIDADAO')
export class SupportChatController {
  constructor(
    private readonly service: SupportChatService,
    private readonly gateway: SupportChatGateway
  ) {}

  @Get('conversation')
  citizenConversation(@Req() req: RequestActor) {
    return this.service.getCitizenConversation(req.user);
  }

  @Get('conversations')
  list(@Req() req: RequestActor) {
    return this.service.list(req.user);
  }

  @Post('conversations')
  start(@Body('citizenId') citizenId: string, @Req() req: RequestActor) {
    return this.service.startForCitizen(citizenId, req.user);
  }

  @Get('conversations/:id')
  get(@Param('id') id: string, @Req() req: RequestActor) {
    return this.service.getConversation(id, req.user);
  }

  @Post('conversations/:id/messages')
  async sendText(@Param('id') id: string, @Body('text') text: string, @Req() req: RequestActor) {
    const message = await this.service.sendText(id, text, req.user);
    this.gateway.emitMessage(id, message);
    return message;
  }

  @Post('conversations/:id/media')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 12 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const allowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/');
      callback(allowed ? null : new Error('Envie somente imagem ou áudio.'), allowed);
    },
    storage: diskStorage({
      destination: (req, _file, callback) => {
        const dir = join(process.cwd(), 'uploads', 'support-chat', String(req.params.id));
        mkdirSync(dir, { recursive: true });
        callback(null, dir);
      },
      filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`)
    })
  }))
  async sendMedia(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: RequestActor) {
    if (!file) throw new BadRequestException('Selecione uma imagem ou um áudio.');
    const message = await this.service.sendMedia(id, file, req.user);
    this.gateway.emitMessage(id, message);
    return message;
  }

  @Patch('conversations/:id/status')
  status(
    @Param('id') id: string,
    @Body('status') status: SupportConversationStatus,
    @Req() req: RequestActor
  ) {
    if (!Object.values(SupportConversationStatus).includes(status)) {
      throw new BadRequestException('Status de atendimento inválido.');
    }
    return this.service.setStatus(id, status, req.user);
  }
}

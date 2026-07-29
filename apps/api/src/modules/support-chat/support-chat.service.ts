import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupportConversationStatus, SupportMessageType, SupportSenderType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Actor = { sub: string; role: UserRole };

@Injectable()
export class SupportChatService {
  constructor(private readonly prisma: PrismaService) {}

  private isCitizen(actor: Actor) {
    return actor.role === UserRole.CIDADAO;
  }

  private async assertAccess(conversationId: string, actor: Actor) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { citizen: true }
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada.');
    if (this.isCitizen(actor) && conversation.citizenId !== actor.sub) {
      throw new ForbiddenException('Conversa não autorizada.');
    }
    return conversation;
  }

  async getCitizenConversation(actor: Actor) {
    if (!this.isCitizen(actor)) throw new ForbiddenException();
    let conversation = await this.prisma.supportConversation.findFirst({
      where: { citizenId: actor.sub, status: { not: SupportConversationStatus.FINALIZADA } },
      orderBy: { updatedAt: 'desc' }
    });
    if (!conversation) {
      const citizen = await this.prisma.citizen.findUnique({ where: { id: actor.sub } });
      if (!citizen) throw new NotFoundException('Cidadão não encontrado.');
      conversation = await this.prisma.supportConversation.create({
        data: { citizenId: actor.sub, healthUnitPsfId: citizen.healthUnitPsfId }
      });
    }
    return this.getConversation(conversation.id, actor);
  }

  async list(actor: Actor) {
    if (this.isCitizen(actor)) return [await this.getCitizenConversation(actor)];
    return this.prisma.supportConversation.findMany({
      include: {
        citizen: { select: { id: true, name: true, phone: true, cpf: true, healthUnitPsfId: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async startForCitizen(citizenId: string, actor: Actor) {
    if (this.isCitizen(actor)) throw new ForbiddenException();
    const citizen = await this.prisma.citizen.findUnique({ where: { id: citizenId } });
    if (!citizen) throw new NotFoundException('Cidadão não encontrado.');
    const existing = await this.prisma.supportConversation.findFirst({
      where: { citizenId, status: { not: SupportConversationStatus.FINALIZADA } },
      orderBy: { updatedAt: 'desc' }
    });
    if (existing) return this.getConversation(existing.id, actor);
    const created = await this.prisma.supportConversation.create({
      data: {
        citizenId,
        healthUnitPsfId: citizen.healthUnitPsfId,
        status: SupportConversationStatus.EM_ATENDIMENTO,
        assignedToId: actor.sub
      }
    });
    return this.getConversation(created.id, actor);
  }

  async getConversation(id: string, actor: Actor) {
    await this.assertAccess(id, actor);
    return this.prisma.supportConversation.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, phone: true, cpf: true, healthUnitPsfId: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: {
          include: {
            citizen: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async sendText(id: string, text: string, actor: Actor) {
    const value = text?.trim();
    if (!value) throw new ForbiddenException('Digite uma mensagem.');
    return this.createMessage(id, actor, SupportMessageType.TEXTO, value);
  }

  async sendMedia(id: string, file: Express.Multer.File, actor: Actor) {
    const type = file.mimetype.startsWith('image/')
      ? SupportMessageType.IMAGEM
      : SupportMessageType.AUDIO;
    return this.createMessage(
      id,
      actor,
      type,
      null,
      `/uploads/support-chat/${id}/${file.filename}`,
      file.mimetype
    );
  }

  private async createMessage(
    id: string,
    actor: Actor,
    type: SupportMessageType,
    text: string | null,
    mediaUrl?: string,
    mimeType?: string
  ) {
    const conversation = await this.assertAccess(id, actor);
    const citizen = this.isCitizen(actor);
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          conversationId: id,
          senderType: citizen ? SupportSenderType.CIDADAO : SupportSenderType.ATENDENTE,
          citizenId: citizen ? actor.sub : null,
          userId: citizen ? null : actor.sub,
          type,
          text,
          mediaUrl,
          mimeType
        },
        include: {
          citizen: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } }
        }
      });
      await tx.supportConversation.update({
        where: { id },
        data: {
          status: citizen ? SupportConversationStatus.NOVA : SupportConversationStatus.EM_ATENDIMENTO,
          assignedToId: citizen ? conversation.assignedToId : actor.sub,
          closedAt: null
        }
      });
      return created;
    });
    return message;
  }

  async setStatus(id: string, status: SupportConversationStatus, actor: Actor) {
    if (this.isCitizen(actor)) throw new ForbiddenException();
    await this.assertAccess(id, actor);
    return this.prisma.supportConversation.update({
      where: { id },
      data: {
        status,
        assignedToId: status === SupportConversationStatus.EM_ATENDIMENTO ? actor.sub : undefined,
        closedAt: status === SupportConversationStatus.FINALIZADA ? new Date() : null
      }
    });
  }
}

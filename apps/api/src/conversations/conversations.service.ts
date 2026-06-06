import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { GatewayService } from '../gateway/gateway.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateMessageDto, UpdateStatusDto, CreateNoteDto } from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private wa: WhatsAppService,
    private gateway: GatewayService,
  ) {}

  // helper: assert conversation belongs to the user's company
  private async assertOwns(conversationId: string, user: JwtPayload) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c || c.companyId !== user.companyId) {
      throw new NotFoundException('Conversation not found');
    }
    return c;
  }

  async list(user: JwtPayload, status?: string) {
    return this.prisma.conversation.findMany({
      where: {
        companyId: user.companyId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        contact: true,
        assignment: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { messages: true } },
      },
    });
  }

  async get(conversationId: string, user: JwtPayload) {
    await this.assertOwns(conversationId, user);
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        assignment: { include: { user: { select: { id: true, name: true, email: true } } } },
        notes: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } },
      },
    });
  }

  async listMessages(conversationId: string, user: JwtPayload, cursor?: string, limit = 50) {
    await this.assertOwns(conversationId, user);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { sender: { select: { id: true, name: true } } },
    });
    return messages.reverse();
  }

  async sendMessage(conversationId: string, dto: CreateMessageDto, user: JwtPayload) {
    const conv = await this.assertOwns(conversationId, user);
    const contact = await this.prisma.contact.findUnique({ where: { id: conv.contactId } });
    if (!contact) throw new NotFoundException('Contact missing');

    // try to send via WhatsApp
    let waMessageId: string | undefined;
    let status: 'PENDING' | 'SENT' | 'FAILED' = 'PENDING';
    try {
      const result: any = await this.wa.sendText(user.companyId, contact.jid, dto.body);
      waMessageId = result?.key?.id;
      status = 'SENT';
    } catch (e: any) {
      this.handleSendError(e);
      status = 'FAILED';
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        companyId: user.companyId,
        senderId: user.sub,
        direction: 'OUTBOUND',
        type: (dto.type as any) || 'TEXT',
        status,
        body: dto.body,
        mediaUrl: dto.mediaUrl,
        mimeType: dto.mimeType,
        waMessageId,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    // update conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: dto.body.slice(0, 120),
        unreadCount: 0,
      },
    });

    // emit
    this.gateway.emitToConversation(conversationId, 'message:new', message);
    this.gateway.emitToCompany(user.companyId, 'conversation:updated', {
      id: conversationId,
      lastMessagePreview: dto.body.slice(0, 120),
      lastMessageAt: new Date(),
    });

    return message;
  }

  async updateStatus(conversationId: string, dto: UpdateStatusDto, user: JwtPayload) {
    await this.assertOwns(conversationId, user);
    const conv = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: dto.status },
    });
    this.gateway.emitToCompany(user.companyId, 'conversation:updated', conv);
    return conv;
  }

  async assign(conversationId: string, userId: string | null, user: JwtPayload) {
    await this.assertOwns(conversationId, user);

    if (userId) {
      // make sure target user is in same company
      const target = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!target || target.companyId !== user.companyId) {
        throw new BadRequestException('User not in your company');
      }
      const assignment = await this.prisma.conversationAssignment.upsert({
        where: { conversationId },
        create: { conversationId, userId },
        update: { userId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      this.gateway.emitToCompany(user.companyId, 'conversation:updated', { id: conversationId, assignment });
      return assignment;
    } else {
      await this.prisma.conversationAssignment.deleteMany({ where: { conversationId } });
      this.gateway.emitToCompany(user.companyId, 'conversation:updated', { id: conversationId, assignment: null });
      return { ok: true };
    }
  }

  async markRead(conversationId: string, user: JwtPayload) {
    await this.assertOwns(conversationId, user);
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
    return { ok: true };
  }

  // notes
  async addNote(conversationId: string, dto: CreateNoteDto, user: JwtPayload) {
    await this.assertOwns(conversationId, user);
    const note = await this.prisma.note.create({
      data: {
        conversationId,
        companyId: user.companyId,
        userId: user.sub,
        body: dto.body,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    this.gateway.emitToCompany(user.companyId, 'note:new', { conversationId, note });
    return note;
  }

  private handleSendError(e: any) {
    if (/not connected/i.test(e.message)) {
      throw new BadRequestException('WhatsApp session is not connected. Please scan QR first.');
    }
    throw new BadRequestException('Failed to send message: ' + e.message);
  }
}

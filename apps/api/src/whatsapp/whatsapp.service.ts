import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';

interface CompanySocket {
  socket: WASocket;
  companyId: string;
  qr?: string;
}

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly sessions = new Map<string, CompanySocket>();
  private sessionsPath: string;

  constructor(
    private prisma: PrismaService,
    private gateway: GatewayService,
    private config: ConfigService,
  ) {
    this.sessionsPath = this.config.get<string>('WA_SESSIONS_PATH') || './sessions';
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  async onModuleInit() {
    // Auto-reconnect any company that had a session
    const existing = await this.prisma.whatsAppSession.findMany({
      where: { status: { in: ['CONNECTED', 'CONNECTING'] } },
    });
    for (const s of existing) {
      this.logger.log(`Restoring WhatsApp session for company ${s.companyId}`);
      await this.connect(s.companyId).catch((e) => {
        this.logger.error(`Failed to restore ${s.companyId}: ${e.message}`);
      });
    }
  }

  private getAuthDir(companyId: string) {
    return path.join(this.sessionsPath, companyId);
  }

  async connect(companyId: string): Promise<{ qr?: string; status: string }> {
    // If already connected, return
    const existing = this.sessions.get(companyId);
    if (existing?.socket) {
      return { status: 'CONNECTED' };
    }

    const authDir = this.getAuthDir(companyId);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['WhatsApp Inbox', 'Chrome', '1.0.0'],
      markOnlineOnConnect: true,
    });

    this.sessions.set(companyId, { socket: sock, companyId });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrImage = await qrcode.toDataURL(qr);
        this.sessions.get(companyId)!.qr = qrImage;
        await this.prisma.whatsAppSession.upsert({
          where: { companyId },
          create: { companyId, status: 'CONNECTING', qrCode: qrImage },
          update: { status: 'CONNECTING', qrCode: qrImage },
        });
        this.gateway.emitToCompany(companyId, 'whatsapp:qr', { qr: qrImage });
      }

      if (connection === 'open') {
        this.logger.log(`WhatsApp connected for company ${companyId}`);
        const phone = sock.user?.id?.split(':')[0];
        await this.prisma.whatsAppSession.update({
          where: { companyId },
          data: {
            status: 'CONNECTED',
            phoneNumber: phone,
            pushName: sock.user?.name,
            qrCode: null,
            connectedAt: new Date(),
            lastError: null,
          },
        });
        this.gateway.emitToCompany(companyId, 'whatsapp:status', { status: 'CONNECTED', phone });
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        this.logger.warn(`WhatsApp disconnected for ${companyId} reason=${reason} reconnect=${shouldReconnect}`);

        await this.prisma.whatsAppSession.update({
          where: { companyId },
          data: {
            status: shouldReconnect ? 'DISCONNECTED' : 'FAILED',
            disconnectedAt: new Date(),
            lastError: String(reason),
          },
        });
        this.sessions.delete(companyId);
        this.gateway.emitToCompany(companyId, 'whatsapp:status', {
          status: shouldReconnect ? 'DISCONNECTED' : 'FAILED',
          reason,
        });

        if (shouldReconnect) {
          // exponential backoff
          setTimeout(() => this.connect(companyId).catch(() => {}), 5000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message) continue;
        await this.handleIncoming(companyId, sock, msg);
      }
    });

    return { status: 'CONNECTING' };
  }

  async getStatus(companyId: string) {
    const session = await this.prisma.whatsAppSession.findUnique({ where: { companyId } });
    return session;
  }

  async getQr(companyId: string) {
    const session = this.sessions.get(companyId);
    return { qr: session?.qr, status: (await this.getStatus(companyId))?.status || 'DISCONNECTED' };
  }

  async disconnect(companyId: string) {
    const s = this.sessions.get(companyId);
    if (s) {
      await s.socket.logout().catch(() => {});
      this.sessions.delete(companyId);
    }
    // wipe auth files
    const authDir = this.getAuthDir(companyId);
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    await this.prisma.whatsAppSession.upsert({
      where: { companyId },
      create: { companyId, status: 'DISCONNECTED' },
      update: { status: 'DISCONNECTED', qrCode: null, disconnectedAt: new Date() },
    });
    this.gateway.emitToCompany(companyId, 'whatsapp:status', { status: 'DISCONNECTED' });
  }

  async sendText(companyId: string, jid: string, text: string) {
    const s = this.sessions.get(companyId);
    if (!s) throw new Error('WhatsApp not connected');
    const result = await s.socket.sendMessage(jid, { text });
    return result;
  }

  async sendMedia(companyId: string, jid: string, mediaPath: string, mimetype: string) {
    const s = this.sessions.get(companyId);
    if (!s) throw new Error('WhatsApp not connected');
    const result = await s.socket.sendMessage(jid, {
      image: { url: mediaPath },
      mimetype,
    });
    return result;
  }

  // ---- internal ----

  private async handleIncoming(companyId: string, sock: WASocket, msg: proto.IWebMessageInfo) {
    try {
      const jid = msg.key.remoteJid;
      if (!jid || jid === 'status@broadcast') return;
      const isGroup = jid.endsWith('@g.us');
      if (isGroup) return; // MVP: only private chats

      const phone = jid.split('@')[0];
      const pushName = msg.pushName || undefined;
      const body = this.extractText(msg);
      const type = this.detectType(msg);

      // upsert contact
      const contact = await this.prisma.contact.upsert({
        where: { companyId_jid: { companyId, jid } },
        create: { companyId, jid, phone, name: pushName, pushName },
        update: { pushName, name: pushName || undefined },
      });

      // upsert conversation
      const conversation = await this.prisma.conversation.upsert({
        where: { companyId_contactId: { companyId, contactId: contact.id } },
        create: {
          companyId,
          contactId: contact.id,
          status: 'OPEN',
          lastMessageAt: new Date(),
          lastMessagePreview: body?.slice(0, 120) || `[${type}]`,
          unreadCount: 1,
        },
        update: {
          lastMessageAt: new Date(),
          lastMessagePreview: body?.slice(0, 120) || `[${type}]`,
          unreadCount: { increment: 1 },
        },
      });

      // store message
      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          companyId,
          direction: 'INBOUND',
          type,
          status: 'DELIVERED',
          body,
          waMessageId: msg.key.id,
          metadata: { pushName, fromMe: false },
        },
        include: { conversation: { include: { contact: true } } },
      });

      // emit real-time
      this.gateway.emitToCompany(companyId, 'message:new', {
        conversationId: conversation.id,
        message,
        contact: message.conversation.contact,
      });
    } catch (e: any) {
      this.logger.error(`handleIncoming failed: ${e.message}`, e.stack);
    }
  }

  private extractText(msg: proto.IWebMessageInfo): string | null {
    const m = msg.message;
    if (!m) return null;
    return (
      m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption ||
      m.documentMessage?.caption ||
      null
    );
  }

  private detectType(msg: proto.IWebMessageInfo): 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
    const m = msg.message;
    if (!m) return 'TEXT';
    if (m.imageMessage) return 'IMAGE';
    if (m.videoMessage) return 'VIDEO';
    if (m.audioMessage) return 'AUDIO';
    if (m.documentMessage) return 'DOCUMENT';
    return 'TEXT';
  }
}

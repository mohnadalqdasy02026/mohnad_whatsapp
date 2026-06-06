import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats(user: JwtPayload) {
    const companyId = user.companyId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalConversations, openCount, pendingCount, closedCount, todayMessages, activeAgents, totalContacts] =
      await Promise.all([
        this.prisma.conversation.count({ where: { companyId } }),
        this.prisma.conversation.count({ where: { companyId, status: 'OPEN' } }),
        this.prisma.conversation.count({ where: { companyId, status: 'PENDING' } }),
        this.prisma.conversation.count({ where: { companyId, status: 'CLOSED' } }),
        this.prisma.message.count({
          where: { companyId, createdAt: { gte: startOfDay } },
        }),
        this.prisma.user.count({ where: { companyId, isActive: true } }),
        this.prisma.contact.count({ where: { companyId } }),
      ]);

    // last 7 days message counts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recent = await this.prisma.message.findMany({
      where: { companyId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, direction: true },
    });

    const days: { date: string; inbound: number; outbound: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const day = recent.filter((m) => m.createdAt.toISOString().slice(0, 10) === dateStr);
      days.push({
        date: dateStr,
        inbound: day.filter((m) => m.direction === 'INBOUND').length,
        outbound: day.filter((m) => m.direction === 'OUTBOUND').length,
      });
    }

    return {
      totalConversations,
      statusBreakdown: { open: openCount, pending: pendingCount, closed: closedCount },
      todayMessages,
      activeAgents,
      totalContacts,
      last7Days: days,
    };
  }
}

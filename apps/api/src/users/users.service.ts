import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateUserDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list(user: JwtPayload) {
    return this.prisma.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto, user: JwtPayload) {
    if (user.role !== 'ADMIN') throw new BadRequestException('Only admin can create users');
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        companyId: user.companyId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  async deactivate(id: string, user: JwtPayload) {
    if (id === user.sub) throw new BadRequestException('Cannot deactivate yourself');
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.companyId !== user.companyId) throw new NotFoundException();
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async activate(id: string, user: JwtPayload) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.companyId !== user.companyId) throw new NotFoundException();
    return this.prisma.user.update({ where: { id }, data: { isActive: true } });
  }
}

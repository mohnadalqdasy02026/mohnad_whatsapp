import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterCompanyDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto) {
    const existing = await this.prisma.company.findFirst({
      where: { OR: [{ slug: dto.slug }, { email: dto.companyEmail }] },
    });
    if (existing) throw new BadRequestException('Company slug or email already exists');

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug: dto.slug,
        email: dto.companyEmail,
        phone: dto.phone,
        users: {
          create: {
            name: dto.name,
            email: dto.email,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const admin = company.users[0];
    return this.signToken({
      sub: admin.id,
      email: admin.email,
      companyId: company.id,
      role: admin.role,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });
    if (!user || !user.isActive || !user.company.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.signToken({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });
  }

  private signToken(payload: JwtPayload) {
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        companyId: payload.companyId,
      },
    };
  }
}

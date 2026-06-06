import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private wa: WhatsAppService) {}

  @Post('connect')
  connect(@CurrentUser() user: JwtPayload) {
    return this.wa.connect(user.companyId);
  }

  @Get('status')
  status(@CurrentUser() user: JwtPayload) {
    return this.wa.getStatus(user.companyId);
  }

  @Get('qr')
  qr(@CurrentUser() user: JwtPayload) {
    return this.wa.getQr(user.companyId);
  }

  @Post('disconnect')
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.wa.disconnect(user.companyId);
  }
}

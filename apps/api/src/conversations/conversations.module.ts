import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [WhatsAppModule, GatewayModule],
  providers: [ConversationsService],
  controllers: [ConversationsController],
  exports: [ConversationsService],
})
export class ConversationsModule {}

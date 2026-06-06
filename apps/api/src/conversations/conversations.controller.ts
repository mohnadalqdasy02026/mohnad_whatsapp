import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateMessageDto, CreateNoteDto, UpdateStatusDto, AssignDto } from './dto/conversation.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conv: ConversationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.conv.list(user, status);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conv.get(id, user);
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Query('cursor') cursor?: string) {
    return this.conv.listMessages(id, user, cursor);
  }

  @Post(':id/messages')
  send(@Param('id') id: string, @Body() dto: CreateMessageDto, @CurrentUser() user: JwtPayload) {
    return this.conv.sendMessage(id, dto, user);
  }

  @Patch(':id/status')
  status(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: JwtPayload) {
    return this.conv.updateStatus(id, dto, user);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDto, @CurrentUser() user: JwtPayload) {
    return this.conv.assign(id, dto.userId ?? null, user);
  }

  @Post(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conv.markRead(id, user);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: CreateNoteDto, @CurrentUser() user: JwtPayload) {
    return this.conv.addNote(id, dto, user);
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateUserDto } from '../auth/dto/auth.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.users.list(user);
  }

  @Post()
  @Roles('ADMIN' as any)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.users.create(dto, user);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN' as any)
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.users.deactivate(id, user);
  }

  @Patch(':id/activate')
  @Roles('ADMIN' as any)
  activate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.users.activate(id, user);
  }
}

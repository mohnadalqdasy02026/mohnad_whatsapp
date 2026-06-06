import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString() body: string;
  @IsOptional() @IsString() type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsString() mimeType?: string;
}

export class UpdateStatusDto {
  @IsIn(['OPEN', 'PENDING', 'CLOSED']) status: 'OPEN' | 'PENDING' | 'CLOSED';
}

export class AssignDto {
  @IsOptional() @IsUUID() userId?: string; // omit to unassign
}

export class CreateNoteDto {
  @IsString() body: string;
}

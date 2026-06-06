import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterCompanyDto {
  @IsString() companyName: string;
  @IsString() slug: string;
  @IsEmail() companyEmail: string;
  @IsOptional() @IsString() phone?: string;

  // Admin user
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}

export class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() role: 'ADMIN' | 'AGENT';
}

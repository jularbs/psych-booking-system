import { IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

import { USER_ROLES, UserRole } from '../../../database/database.types';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  password!: string;

  @IsOptional()
  @IsString()
  @IsIn(USER_ROLES)
  role?: UserRole;
}

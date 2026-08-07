import { IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleOAuthCallbackQueryDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  state!: string;

  @IsOptional()
  @IsString()
  error?: string;
}

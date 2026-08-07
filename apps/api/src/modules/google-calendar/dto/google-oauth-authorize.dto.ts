import { IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleOAuthAuthorizeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  return_to?: string;
}

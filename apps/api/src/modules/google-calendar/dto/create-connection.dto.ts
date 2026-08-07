import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateConnectionDto {
  @IsEmail()
  google_email!: string;

  @IsString()
  @MinLength(3)
  provider_subject!: string;
}

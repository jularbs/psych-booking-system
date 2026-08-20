import { IsString, IsUUID, MinLength, IsEmail, IsISO8601, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  service_id!: string;

  @IsString()
  @MinLength(1)
  customer_name!: string;

  @IsEmail()
  customer_email!: string;

  @IsISO8601()
  starts_at!: string;

  @IsISO8601()
  ends_at!: string;

  @IsString()
  @IsOptional()
  time_zone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class QueryGoogleCalendarAvailabilityDto {
  @IsISO8601()
  time_min!: string;

  @IsISO8601()
  time_max!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  time_zone?: string;
}

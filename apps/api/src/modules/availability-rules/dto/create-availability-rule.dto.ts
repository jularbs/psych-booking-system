import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateAvailabilityRuleDto {
  @IsIn(['weekly_window', 'blackout_window'])
  rule_type!: 'weekly_window' | 'blackout_window';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  day_of_week?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  end_time?: string;

  @IsOptional()
  @IsString()
  time_zone?: string;

  @IsOptional()
  @IsISO8601()
  date_start?: string;

  @IsOptional()
  @IsISO8601()
  date_end?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

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

export class UpdateAvailabilityRuleDto {
  @IsOptional()
  @IsIn(['weekly_window', 'blackout_window'])
  rule_type?: 'weekly_window' | 'blackout_window';

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  day_of_week?: number | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  start_time?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  end_time?: string | null;

  @IsOptional()
  @IsISO8601()
  date_start?: string | null;

  @IsOptional()
  @IsISO8601()
  date_end?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

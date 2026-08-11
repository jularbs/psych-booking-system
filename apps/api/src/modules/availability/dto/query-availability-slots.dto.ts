import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryAvailabilitySlotsDto {
  @IsISO8601()
  time_min!: string;

  @IsISO8601()
  time_max!: string;

  @IsInt()
  @Min(5)
  @Max(480)
  slot_duration_minutes!: number;

  @IsInt()
  @Min(5)
  @Max(240)
  slot_interval_minutes!: number;

  @IsOptional()
  @IsString()
  time_zone?: string;
}

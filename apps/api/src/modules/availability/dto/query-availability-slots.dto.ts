import { IsInt, IsISO8601, Max, Min } from 'class-validator';

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
}

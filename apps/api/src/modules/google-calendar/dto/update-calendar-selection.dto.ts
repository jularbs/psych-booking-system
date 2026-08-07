import { IsString, MinLength } from 'class-validator';

export class UpdateCalendarSelectionDto {
  @IsString()
  @MinLength(1)
  calendar_id!: string;

  @IsString()
  @MinLength(1)
  calendar_summary!: string;
}

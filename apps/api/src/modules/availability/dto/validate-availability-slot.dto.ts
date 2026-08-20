import { IsISO8601 } from 'class-validator';

export class ValidateAvailabilitySlotDto {
  @IsISO8601()
  start!: string;

  @IsISO8601()
  end!: string;
}

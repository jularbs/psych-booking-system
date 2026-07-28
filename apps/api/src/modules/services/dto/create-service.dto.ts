import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  slug!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(10)
  duration_minutes!: number;

  @Matches(/^\d+(\.\d{2})$/, {
    message: 'priceAmount must be a valid decimal string with two decimal places',
  })
  price_amount!: string;

  @IsString()
  @Length(3, 3, { message: 'currency must be a valid ISO 4217 currency code' })
  currency!: string;

  @IsBoolean()
  is_active!: boolean;
}

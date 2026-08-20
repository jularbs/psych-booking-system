import { Controller, UseGuards, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AvailabilitySlotGenerationService } from './availability-slot-generation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryAvailabilitySlotsDto } from './dto/query-availability-slots.dto';
import { ValidateAvailabilitySlotDto } from './dto/validate-availability-slot.dto';
import { AvailabilitySlotValidationService } from './availability-slot-validation.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT')
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilitySlotGenerationService: AvailabilitySlotGenerationService,
    private readonly availabilitySlotValidationService: AvailabilitySlotValidationService,
  ) {}

  @Post('slots/query')
  querySlots(@CurrentUser('sub') userId: string, @Body() dto: QueryAvailabilitySlotsDto) {
    if (!userId) {
      throw new UnauthorizedException('User ID is missing from the request context.');
    }

    return this.availabilitySlotGenerationService.querySlots({ user_id: userId, ...dto });
  }

  @Post('slots/validate')
  validateSlot(@CurrentUser('sub') userId: string, @Body() dto: ValidateAvailabilitySlotDto) {
    if (!userId) {
      throw new UnauthorizedException('User ID is missing from the request context.');
    }

    return this.availabilitySlotValidationService.validateSlot(userId, dto.start, dto.end);
  }
}

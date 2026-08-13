import { Module } from '@nestjs/common';
import { AvailabilitySlotGenerationService } from './availability-slot-generation.service';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { AvailabilityRulesModule } from '../availability-rules/availability-rules.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilitySlotValidationService } from './availability-slot-validation.service';

@Module({
  imports: [AvailabilityRulesModule, GoogleCalendarModule],
  providers: [AvailabilitySlotGenerationService, AvailabilitySlotValidationService],
  controllers: [AvailabilityController],
  exports: [AvailabilitySlotGenerationService, AvailabilitySlotValidationService],
})
export class AvailabilityModule {}

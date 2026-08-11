import { Module } from '@nestjs/common';
import { AvailabilitySlotGenerationService } from './availability-slot-generation.service';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { AvailabilityRulesModule } from '../availability-rules/availability-rules.module';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [AvailabilityRulesModule, GoogleCalendarModule],
  providers: [AvailabilitySlotGenerationService],
  controllers: [AvailabilityController],
  exports: [AvailabilitySlotGenerationService],
})
export class AvailabilityModule {}

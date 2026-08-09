import { Module } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';
import { AvailabilityRulesController } from './availability-rules.controller';
import { AvailabilityRulesRepository } from './availability-rules.repository';

@Module({
  controllers: [AvailabilityRulesController],
  providers: [AvailabilityRulesService, AvailabilityRulesRepository],
  exports: [AvailabilityRulesService],
})
export class AvailabilityRulesModule {}

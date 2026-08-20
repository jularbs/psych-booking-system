import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { ServicesModule } from '../services/services.module';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [AvailabilityModule, ServicesModule],
  providers: [BookingsRepository, BookingsService],
  exports: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}

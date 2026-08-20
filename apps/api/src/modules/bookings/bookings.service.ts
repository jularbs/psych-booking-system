import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { AvailabilitySlotValidationService } from '../availability/availability-slot-validation.service';
import { ServicesService } from '../services/services.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { isValidIsoWithOffset } from '../../common/utils/date.utils';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly slotValidationService: AvailabilitySlotValidationService,
    private readonly servicesService: ServicesService,
  ) {}

  listMine(userId: string) {
    return this.bookingsRepository.listByUserId(userId);
  }

  async getById(id: string) {
    const booking = await this.bookingsRepository.findById(id);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async create(params: CreateBookingDto & { user_id: string }) {
    if (!params.user_id) {
      throw new BadRequestException('User ID is required to create a booking');
    }

    if (!isValidIsoWithOffset(params.starts_at) || !isValidIsoWithOffset(params.ends_at)) {
      throw new BadRequestException('Invalid start or end time format');
    }

    if (params.ends_at <= params.starts_at) {
      throw new BadRequestException('End time must be after start time');
    }

    const service = await this.servicesService.getById(params.service_id);

    if (!service || !service.is_active) {
      throw new NotFoundException('Service not found');
    }

    const isSlotAvailable = await this.slotValidationService.validateSlot(
      params.user_id,
      params.starts_at,
      params.ends_at,
    );

    if (!isSlotAvailable.isValid) {
      throw new BadRequestException(`Booking slot is not available: ${isSlotAvailable.reason}`);
    }

    return this.bookingsRepository.create({
      ...params,
      status: 'pending',
      time_zone: params.time_zone ?? 'Asia/Manila',
      google_calendar_event_id: null,
      notes: params.notes ?? null,
    });
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { AvailabilitySlotValidationService } from '../availability/availability-slot-validation.service';
import { ServicesService } from '../services/services.service';
import { BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingsService', () => {
  let service: BookingsService;

  const bookingsRepository = {
    findById: vi.fn(),
    listByUserId: vi.fn(),
    create: vi.fn(),
  };

  const slotValidationService = {
    validateSlot: vi.fn(),
  };

  const servicesService = {
    getById: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: bookingsRepository },
        { provide: AvailabilitySlotValidationService, useValue: slotValidationService },
        { provide: ServicesService, useValue: servicesService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('lists bookings for user', async () => {
    const userId = 'user-1';
    bookingsRepository.listByUserId.mockResolvedValueOnce([{ id: 'booking-1', user_id: userId }]);

    const result = await service.listMine(userId);

    expect(bookingsRepository.listByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual([{ id: 'booking-1', user_id: userId }]);
  });

  it('gets booking by id', async () => {
    const bookingId = 'booking-1';
    bookingsRepository.findById.mockResolvedValueOnce({ id: bookingId });

    const result = await service.getById(bookingId);

    expect(bookingsRepository.findById).toHaveBeenCalledWith(bookingId);
    expect(result).toEqual({ id: bookingId });
  });

  it('throws NotFoundException when booking not found', async () => {
    const bookingId = 'non-existent-booking';
    bookingsRepository.findById.mockResolvedValueOnce(undefined);

    await expect(service.getById(bookingId)).rejects.toThrow('Booking not found');
  });

  it('creates a new booking', async () => {
    const params: CreateBookingDto & { user_id: string } = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2024-06-01T10:00:00Z',
      ends_at: '2024-06-01T11:00:00Z',
      time_zone: 'Asia/Manila',
    };

    servicesService.getById.mockResolvedValueOnce({ id: params.service_id, is_active: true });
    slotValidationService.validateSlot.mockResolvedValueOnce({ isValid: true });
    bookingsRepository.create.mockResolvedValueOnce({ id: 'booking-1', ...params });

    const result = await service.create(params);

    expect(servicesService.getById).toHaveBeenCalledWith(params.service_id);
    expect(slotValidationService.validateSlot).toHaveBeenCalledWith(
      params.user_id,
      params.starts_at,
      params.ends_at,
    );
    expect(bookingsRepository.create).toHaveBeenCalledWith({
      ...params,
      status: 'pending',
      google_calendar_event_id: null,
      notes: params.notes ?? null,
    });

    expect(result).toEqual({ id: 'booking-1', ...params });
  });

  it('throws NotFoundException when service is not found', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'non-existent-service',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2024-06-01T10:00:00Z',
      ends_at: '2024-06-01T11:00:00Z',
      time_zone: 'Asia/Manila',
    };

    servicesService.getById.mockResolvedValueOnce(undefined);

    await expect(service.create(params)).rejects.toThrow('Service not found');
  });

  it('throws BadRequestException when slot is not available', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2024-06-01T10:00:00Z',
      ends_at: '2024-06-01T11:00:00Z',
      time_zone: 'Asia/Manila',
    };

    servicesService.getById.mockResolvedValueOnce({ id: params.service_id, is_active: true });
    slotValidationService.validateSlot.mockResolvedValueOnce({
      isValid: false,
      reason: 'overlaps_google_busy_times',
    });

    await expect(service.create(params)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when service is inactive', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2024-06-01T10:00:00Z',
      ends_at: '2024-06-01T11:00:00Z',
      time_zone: 'Asia/Manila',
    };

    servicesService.getById.mockResolvedValueOnce({ id: params.service_id, is_active: false });

    await expect(service.create(params)).rejects.toThrow('Service not found');
  });

  it('throws BadRequestException when end time is before start time', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2024-06-01T11:00:00Z',
      ends_at: '2024-06-01T10:00:00Z',
      time_zone: 'Asia/Manila',
    };

    await expect(service.create(params)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when start or end time has no offset', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2024-06-01T10:00:00', // No offset
      ends_at: '2024-06-01T11:00:00', // No offset
      time_zone: 'Asia/Manila',
    };

    await expect(service.create(params)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when start or end time is invalid', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'user@example.com',
      starts_at: 'invalid-start-time',
      ends_at: 'invalid-end-time',
      time_zone: 'Asia/Manila',
    };

    await expect(service.create(params)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when start or end time is not ISO 8601', async () => {
    const params = {
      user_id: 'user-1',
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'user@example.com',
      starts_at: '2024-06-01 10:00:00', // Not ISO 8601
      ends_at: '2024-06-01 11:00:00', // Not ISO 8601
      time_zone: 'Asia/Manila',
    };

    await expect(service.create(params)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when user_id is missing', async () => {
    const params = {
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'user@example.com',
      starts_at: '2024-06-01T10:00:00Z',
      ends_at: '2024-06-01T11:00:00Z',
      time_zone: 'Asia/Manila',
    };

    await expect(
      service.create(params as CreateBookingDto & { user_id: string }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

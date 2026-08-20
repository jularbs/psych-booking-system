import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { UnauthorizedException } from '@nestjs/common';

describe('BookingsController', () => {
  let controller: BookingsController;

  const bookingService = {
    listMine: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('lists current user bookings', async () => {
    const userId = 'user-1';
    bookingService.listMine.mockResolvedValueOnce([{ id: 'booking-1', user_id: userId }]);

    const result = await controller.listMine(userId);

    expect(bookingService.listMine).toHaveBeenCalledWith(userId);
    expect(result).toEqual([{ id: 'booking-1', user_id: userId }]);
  });

  it('gets booking by id', async () => {
    const bookingId = 'booking-1';
    bookingService.getById.mockResolvedValueOnce({ id: bookingId });

    const result = await controller.getById(bookingId);

    expect(bookingService.getById).toHaveBeenCalledWith(bookingId);
    expect(result).toEqual({ id: bookingId });
  });

  it('creates a new booking', async () => {
    const userId = 'user-1';
    const dto = {
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'user@example.com',
      starts_at: '2024-06-01T10:00:00+08:00',
      ends_at: '2024-06-01T11:00:00+08:00',
    };
    bookingService.create.mockResolvedValueOnce({ id: 'booking-1', user_id: userId, ...dto });

    const result = await controller.create(userId, dto);

    expect(bookingService.create).toHaveBeenCalledWith({ user_id: userId, ...dto });
    expect(result).toEqual({ id: 'booking-1', user_id: userId, ...dto });
  });

  it('throws UnauthorizedException when userId is not provided for listMine', async () => {
    await expect(controller.listMine(undefined as unknown as string)).rejects.toThrow(
      'User not authenticated',
    );
  });

  it('throws UnauthorizedException when userId is not provided for create', async () => {
    const dto = {
      service_id: 'service-1',
      customer_name: 'John Doe',
      customer_email: 'user@example.com',
      starts_at: '2024-06-01T10:00:00+08:00',
      ends_at: '2024-06-01T11:00:00+08:00',
    };
    await expect(controller.create(undefined as unknown as string, dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

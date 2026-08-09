import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCalendarAvailabilityController } from './google-calendar-availability.controller';
import { GoogleCalendarAvailabilityService } from './google-calendar-availability.service';

describe('GoogleCalendarAvailabilityController', () => {
  let controller: GoogleCalendarAvailabilityController;

  const availabilityService = {
    queryMyAvailability: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleCalendarAvailabilityController],
      providers: [{ provide: GoogleCalendarAvailabilityService, useValue: availabilityService }],
    }).compile();

    controller = module.get<GoogleCalendarAvailabilityController>(
      GoogleCalendarAvailabilityController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('queries availability for the current user', async () => {
    availabilityService.queryMyAvailability.mockResolvedValue({
      calendar_id: 'calendar-123',
      busy_times: [
        { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
        { start: '2024-01-01T14:00:00Z', end: '2024-01-01T15:00:00Z' },
      ],
    });

    const result = await controller.queryAvailability('user-123', {
      time_min: '2024-01-01T00:00:00Z',
      time_max: '2024-01-02T00:00:00Z',
    });

    expect(availabilityService.queryMyAvailability).toHaveBeenCalledWith({
      user_id: 'user-123',
      time_min: '2024-01-01T00:00:00Z',
      time_max: '2024-01-02T00:00:00Z',
      time_zone: undefined,
    });

    expect(result).toEqual({
      calendar_id: 'calendar-123',
      busy_times: [
        { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
        { start: '2024-01-01T14:00:00Z', end: '2024-01-01T15:00:00Z' },
      ],
    });
  });
});

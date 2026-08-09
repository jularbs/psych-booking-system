import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { GoogleCalendarAvailabilityService } from './google-calendar-availability.service';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleCalendarAdapterService } from './google-calendar-adapter.service';

describe('GoogleCalendarAvailabilityService', () => {
  let service: GoogleCalendarAvailabilityService;

  const connectionService = {
    getByUserId: vi.fn(),
  };

  const adapterService = {
    getBusyTimes: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarAvailabilityService,
        { provide: GoogleCalendarConnectionsService, useValue: connectionService },
        { provide: GoogleCalendarAdapterService, useValue: adapterService },
      ],
    }).compile();

    service = module.get<GoogleCalendarAvailabilityService>(GoogleCalendarAvailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('queries busy times from selected calendar', async () => {
    connectionService.getByUserId.mockResolvedValue({
      user_id: 'user-123',
      status: 'active',
      access_token: 'access-token-123',
      calendar_id: 'calendar-123',
    });

    adapterService.getBusyTimes.mockResolvedValue({
      'calendar-123': [
        { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
        { start: '2024-01-01T14:00:00Z', end: '2024-01-01T15:00:00Z' },
      ],
    });

    const result = await service.queryMyAvailability({
      user_id: 'user-123',
      time_min: '2024-01-01T00:00:00Z',
      time_max: '2024-01-02T00:00:00Z',
    });

    expect(adapterService.getBusyTimes).toHaveBeenCalledWith('access-token-123', {
      calendar_ids: ['calendar-123'],
      time_min: '2024-01-01T00:00:00Z',
      time_max: '2024-01-02T00:00:00Z',
      time_zone: null,
    });

    expect(result).toEqual({
      calendar_id: 'calendar-123',
      busy_times: [
        { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
        { start: '2024-01-01T14:00:00Z', end: '2024-01-01T15:00:00Z' },
      ],
    });
  });

  it('throws conflict exception if connection is not found', async () => {
    connectionService.getByUserId.mockResolvedValue(null);

    await expect(
      service.queryMyAvailability({
        user_id: 'user-123',
        time_min: '2024-01-01T00:00:00Z',
        time_max: '2024-01-02T00:00:00Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws conflict exception if connection is not active', async () => {
    connectionService.getByUserId.mockResolvedValue({
      user_id: 'user-123',
      status: 'revoked',
      access_token: 'access-token-123',
      calendar_id: 'calendar-123',
    });

    await expect(
      service.queryMyAvailability({
        user_id: 'user-123',
        time_min: '2024-01-01T00:00:00Z',
        time_max: '2024-01-02T00:00:00Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws conflict exception if connection does not have access token', async () => {
    connectionService.getByUserId.mockResolvedValue({
      user_id: 'user-123',
      status: 'active',
      access_token: null,
      calendar_id: 'calendar-123',
    });

    await expect(
      service.queryMyAvailability({
        user_id: 'user-123',
        time_min: '2024-01-01T00:00:00Z',
        time_max: '2024-01-02T00:00:00Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws conflict exception if connection does not have calendar ID', async () => {
    connectionService.getByUserId.mockResolvedValue({
      user_id: 'user-123',
      status: 'active',
      access_token: 'access-token-123',
      calendar_id: null,
    });

    await expect(
      service.queryMyAvailability({
        user_id: 'user-123',
        time_min: '2024-01-01T00:00:00Z',
        time_max: '2024-01-02T00:00:00Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

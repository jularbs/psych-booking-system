import { BadGatewayException } from '@nestjs/common';
import { GoogleCalendarProviderService } from './google-calendar-provider.service';

describe('GoogleCalendarProviderService', () => {
  let service: GoogleCalendarProviderService;

  const clientFactory = {
    createCalendarClient: vi.fn(),
    createOAuthUserInfoClient: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new GoogleCalendarProviderService(clientFactory as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gets google profile correctly', async () => {
    clientFactory.createOAuthUserInfoClient.mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({
        sub: 'user-123',
        email: 'staff@gmail.com',
      }),
    });

    const result = await service.getProfile('access-token-123');

    expect(clientFactory.createOAuthUserInfoClient().getProfile).toHaveBeenCalledWith(
      'access-token-123',
    );
    expect(result).toEqual({
      sub: 'user-123',
      email: 'staff@gmail.com',
    });
  });

  it('throws when google profile is incomplete', async () => {
    clientFactory.createOAuthUserInfoClient.mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({
        sub: 'user-123',
        email: '',
      }),
    });

    await expect(service.getProfile('access-token-123')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('lists calendars and normalizes correctly', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      listCalendars: vi.fn().mockResolvedValue([
        { id: 'calendar-1', summary: 'Work Calendar', primary: true, access_role: 'owner' },
        { id: 'calendar-2', summary: 'Personal Calendar', time_zone: 'UTC' },
      ]),
    });

    const result = await service.listCalendars('access-token-123');

    expect(result).toEqual([
      { id: 'calendar-1', summary: 'Work Calendar', primary: true, access_role: 'owner' },
      { id: 'calendar-2', summary: 'Personal Calendar', time_zone: 'UTC' },
    ]);
  });

  it('gets busy times and normalizes correctly', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      getBusyTimes: vi.fn().mockResolvedValue({
        calendars: {
          'calendar-1': {
            busy: [
              { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
              { start: '2024-01-01T12:00:00Z', end: '2024-01-01T13:00:00Z' },
            ],
          },
          'calendar-2': {
            busy: [{ start: '2024-01-02T14:00:00Z', end: '2024-01-02T15:00:00Z' }],
          },
        },
      }),
    });

    const result = await service.getBusyTimes('access-token-123', {
      calendar_ids: ['calendar-1', 'calendar-2'],
      time_min: '2024-01-01T00:00:00Z',
      time_max: '2024-01-03T00:00:00Z',
    });

    expect(result).toEqual({
      'calendar-1': [
        { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' },
        { start: '2024-01-01T12:00:00Z', end: '2024-01-01T13:00:00Z' },
      ],
      'calendar-2': [{ start: '2024-01-02T14:00:00Z', end: '2024-01-02T15:00:00Z' }],
    });
  });

  it('creates and normalizes event correctly', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      createEvent: vi.fn().mockResolvedValue({
        id: 'event-123',
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/event?eid=event-123',
        summary: 'Meeting',
        description: 'Team meeting',
        start: { dateTime: '2024-01-01T10:00:00Z' },
        end: { dateTime: '2024-01-01T11:00:00Z' },
      }),
    });

    const result = await service.createEvent('access-token-123', {
      calendar_id: 'calendar-1',
      summary: 'Meeting',
      start: '2024-01-01T10:00:00Z',
      end: '2024-01-01T11:00:00Z',
    });

    expect(result).toEqual({
      id: 'event-123',
      status: 'confirmed',
      html_link: 'https://calendar.google.com/event?eid=event-123',
      summary: 'Meeting',
      description: 'Team meeting',
      start: '2024-01-01T10:00:00Z',
      end: '2024-01-01T11:00:00Z',
    });
  });

  it('updates and normalizes event correctly', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      updateEvent: vi.fn().mockResolvedValue({
        id: 'event-123',
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/event?eid=event-123',
        summary: 'Updated Meeting',
        description: 'Updated team meeting',
        start: { dateTime: '2024-01-01T12:00:00Z' },
        end: { dateTime: '2024-01-01T13:00:00Z' },
      }),
    });

    const result = await service.updateEvent('access-token-123', 'event-123', {
      calendar_id: 'calendar-1',
      summary: 'Updated Meeting',
      start: '2024-01-01T12:00:00Z',
      end: '2024-01-01T13:00:00Z',
    });

    expect(result).toEqual({
      id: 'event-123',
      status: 'confirmed',
      html_link: 'https://calendar.google.com/event?eid=event-123',
      summary: 'Updated Meeting',
      description: 'Updated team meeting',
      start: '2024-01-01T12:00:00Z',
      end: '2024-01-01T13:00:00Z',
    });
  });

  it('throws when event response is incomplete', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      createEvent: vi.fn().mockResolvedValue({
        id: null,
        status: null,
        start: { dateTime: null },
        end: { dateTime: null },
      }),
    });

    await expect(
      service.createEvent('access-token-123', {
        calendar_id: 'calendar-1',
        summary: 'Meeting',
        start: '2024-01-01T10:00:00Z',
        end: '2024-01-01T11:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('cancels event correctly', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      cancelEvent: vi.fn().mockResolvedValue(undefined),
    });

    await service.cancelEvent('access-token-123', 'calendar-1', 'event-123');

    expect(clientFactory.createCalendarClient().cancelEvent).toHaveBeenCalledWith(
      'access-token-123',
      'calendar-1',
      'event-123',
    );
  });
});

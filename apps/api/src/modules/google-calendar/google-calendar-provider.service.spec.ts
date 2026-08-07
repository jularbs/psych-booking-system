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

  it('lists calendars correctly', async () => {
    clientFactory.createCalendarClient.mockReturnValue({
      listCalendars: vi.fn().mockResolvedValue([
        { id: 'calendar-1', summary: 'Work Calendar' },
        { id: 'calendar-2', summary: 'Personal Calendar' },
      ]),
    });

    const result = await service.listCalendars('access-token-123');

    expect(clientFactory.createCalendarClient().listCalendars).toHaveBeenCalledWith(
      'access-token-123',
    );
    expect(result).toEqual([
      { id: 'calendar-1', summary: 'Work Calendar' },
      { id: 'calendar-2', summary: 'Personal Calendar' },
    ]);
  });
});

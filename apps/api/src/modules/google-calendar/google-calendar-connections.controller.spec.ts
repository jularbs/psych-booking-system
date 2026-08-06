import { GoogleCalendarConnectionsController } from './google-calendar-connections.controller';
import { UnauthorizedException } from '@nestjs/common';

describe('GoogleCalendarConnectionsController', () => {
  let controller: GoogleCalendarConnectionsController;

  const service = {
    getByUserId: vi.fn(),
    create: vi.fn(),
    updateCalendarSelection: vi.fn(),
    revoke: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    controller = new GoogleCalendarConnectionsController(service as never);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('gets current user connection', async () => {
    service.getByUserId.mockResolvedValue({
      id: 'connection-id',
      user_id: 'user-id',
    });

    const result = await controller.getMine('user-id');

    expect(service.getByUserId).toHaveBeenCalledWith('user-id');
    expect(result).toEqual({
      id: 'connection-id',
      user_id: 'user-id',
    });
  });

  it('throws UnauthorizedException when current user id is missing', async () => {
    await expect(controller.getMine(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates a new connection for the current user', async () => {
    service.create.mockResolvedValue({
      id: 'new-connection-id',
      user_id: 'user-id',
      google_email: 'user@gmail.com',
      provider_subject: 'google-sub-123',
      status: 'pending',
    });

    const result = await controller.create('user-id', {
      google_email: 'user@gmail.com',
      provider_subject: 'google-sub-123',
    });

    expect(service.create).toHaveBeenCalledWith({
      user_id: 'user-id',
      google_email: 'user@gmail.com',
      provider_subject: 'google-sub-123',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'new-connection-id',
        user_id: 'user-id',
        google_email: 'user@gmail.com',
        provider_subject: 'google-sub-123',
        status: 'pending',
      }),
    );
  });

  it('updates calendar selection for the current user', async () => {
    service.updateCalendarSelection.mockResolvedValue({
      id: 'connection-id',
      user_id: 'user-id',
      calendar_id: 'calendar-id',
      calendar_summary: 'My Calendar',
      status: 'active',
    });

    const result = await controller.updateCalendarSelection('connection-id', {
      calendar_id: 'calendar-id',
      calendar_summary: 'My Calendar',
    });

    expect(service.updateCalendarSelection).toHaveBeenCalledWith('connection-id', {
      calendar_id: 'calendar-id',
      calendar_summary: 'My Calendar',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'connection-id',
        user_id: 'user-id',
        calendar_id: 'calendar-id',
        calendar_summary: 'My Calendar',
        status: 'active',
      }),
    );
  });

  it('revokes the connection for the current user', async () => {
    service.revoke.mockResolvedValue({
      id: 'connection-id',
      user_id: 'user-id',
      status: 'revoked',
    });

    const result = await controller.revoke('connection-id');

    expect(service.revoke).toHaveBeenCalledWith('connection-id');
    expect(result).toEqual(
      expect.objectContaining({
        id: 'connection-id',
        user_id: 'user-id',
        status: 'revoked',
      }),
    );
  });
});

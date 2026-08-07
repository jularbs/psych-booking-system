import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCalendarConnectionsRepository } from './google-calendar-connections.repository';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GoogleCalendarProviderService } from './google-calendar-provider.service';

describe('GoogleCalendarConnectionsService', () => {
  let service: GoogleCalendarConnectionsService;

  const repository = {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const providersService = {
    listCalendars: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarConnectionsService,
        { provide: GoogleCalendarConnectionsRepository, useValue: repository },
        { provide: GoogleCalendarProviderService, useValue: providersService },
      ],
    }).compile();
    service = module.get<GoogleCalendarConnectionsService>(GoogleCalendarConnectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gets connection by user ID', async () => {
    const user_id = 'user-id';
    const connection = { id: 'connection-id', user_id, status: 'active' };
    repository.findByUserId.mockResolvedValue(connection);

    const result = await service.getByUserId(user_id);

    expect(repository.findByUserId).toHaveBeenCalledWith(user_id);
    expect(result).toEqual(connection);
  });

  it('returns null if no connection is found by user ID', async () => {
    const user_id = 'user-id';
    repository.findByUserId.mockResolvedValue(null);

    const result = await service.getByUserId(user_id);

    expect(repository.findByUserId).toHaveBeenCalledWith(user_id);
    expect(result).toBeNull();
  });

  it('creates a pending connection for a user when none exists', async () => {
    const user_id = 'user-id';
    repository.findByUserId.mockResolvedValue(null);
    const newConnection = {
      id: 'new-connection-id',
      user_id,
      google_email: 'user@example.com',
      provider_subject: 'google-sub-123',
      status: 'pending',
    };
    repository.create.mockResolvedValue(newConnection);

    const result = await service.create({
      user_id,
      google_email: 'user@example.com',
      provider_subject: 'google-sub-123',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id,
        google_email: 'user@example.com',
        provider_subject: 'google-sub-123',
        status: 'pending',
      }),
    );
    expect(result).toEqual(expect.objectContaining(newConnection));
    expect(result.status).toBe('pending');
  });

  it('throws conflict when user already has a connection', async () => {
    repository.findByUserId.mockResolvedValue({
      id: 'existing-connection-id',
      user_id: 'user-id',
      status: 'active',
    });

    await expect(
      service.create({
        user_id: 'user-id',
        google_email: 'user@example.com',
        provider_subject: 'google-sub-123',
        status: 'pending',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates selected calendar', async () => {
    repository.findById.mockResolvedValue({
      id: 'connection-id',
      user_id: 'user-id',
    });

    repository.update.mockResolvedValue(undefined);
    repository.findById
      .mockResolvedValueOnce({
        id: 'connection-id',
        user_id: 'user-id',
      })
      .mockResolvedValueOnce({
        id: 'connection-id',
        user_id: 'user-id',
        calendar_id: 'calendar-id',
        calendar_summary: 'My Calendar',
        status: 'active',
      });

    const result = await service.updateCalendarSelection('connection-id', {
      calendar_id: 'calendar-id',
      calendar_summary: 'My Calendar',
    });

    expect(repository.update).toHaveBeenCalledWith('connection-id', {
      calendar_id: 'calendar-id',
      calendar_summary: 'My Calendar',
      status: 'active',
    });
    expect(result).toEqual(
      expect.objectContaining({
        calendar_id: 'calendar-id',
        calendar_summary: 'My Calendar',
        status: 'active',
      }),
    );
  });

  it('throws error when trying to update calendar for non-existent connection', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updateCalendarSelection('non-existent-connection-id', {
        calendar_id: 'calendar-id',
        calendar_summary: 'My Calendar',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks a connection as revoked', async () => {
    repository.findById.mockResolvedValue({
      id: 'connection-id',
      user_id: 'user-id',
      status: 'active',
    });

    repository.update.mockResolvedValue(undefined);
    repository.findById
      .mockResolvedValueOnce({
        id: 'connection-id',
        user_id: 'user-id',
        status: 'active',
      })
      .mockResolvedValueOnce({
        id: 'connection-id',
        user_id: 'user-id',
        status: 'revoked',
      });

    const result = await service.revoke('connection-id');

    expect(repository.update).toHaveBeenCalledWith('connection-id', {
      status: 'revoked',
    });
    expect(result).toEqual(
      expect.objectContaining({
        status: 'revoked',
      }),
    );
  });

  it('creates a connection from oauth callback when none exists', async () => {
    repository.findByUserId.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'new-connection-id',
      user_id: 'user-id',
      google_email: 'user@example.com',
      provider_subject: 'google-sub-123',
      status: 'active',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_expiry: '2026-08-07T10:00:00.000Z',
      scope: 'openid email profile',
      calendar_id: null,
      calendar_summary: null,
      sync_token: null,
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
      last_synced_at: null,
      created_at: '2026-08-07T09:00:00.000Z',
      updated_at: '2026-08-07T09:00:00.000Z',
    });

    repository.create.mockResolvedValue(undefined);

    const result = await service.upsertOAuthConnectionForUser({
      user_id: 'user-id',
      google_email: 'user@example.com',
      provider_subject: 'google-sub-123',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_expiry: '2026-08-07T10:00:00.000Z',
      scope: 'openid email profile',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-id',
        google_email: 'user@example.com',
        provider_subject: 'google-sub-123',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_expiry: '2026-08-07T10:00:00.000Z',
        scope: 'openid email profile',
      }),
    );

    expect(result.status).toBe('active');
  });

  it('updates an existing connection from oauth callback', async () => {
    repository.findByUserId.mockResolvedValueOnce({
      id: 'conn-1',
      user_id: 'user-1',
      refresh_token: 'old-refresh-token',
    });

    repository.findById.mockResolvedValueOnce({
      id: 'conn-1',
      user_id: 'user-1',
      google_email: 'staff@gmail.com',
      provider_subject: 'google-sub-123',
      access_token: 'new-access-token',
      refresh_token: 'old-refresh-token',
      token_expiry: '2026-08-07T11:00:00.000Z',
      scope: 'openid email profile',
      calendar_id: null,
      calendar_summary: null,
      sync_token: null,
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
      status: 'active',
      last_synced_at: null,
      created_at: '2026-08-07T09:00:00.000Z',
      updated_at: '2026-08-07T09:30:00.000Z',
    });

    repository.update.mockResolvedValue(undefined);

    const result = await service.upsertOAuthConnectionForUser({
      user_id: 'user-1',
      google_email: 'staff@gmail.com',
      provider_subject: 'google-sub-123',
      access_token: 'new-access-token',
      refresh_token: null,
      token_expiry: '2026-08-07T11:00:00.000Z',
      scope: 'openid email profile',
    });

    expect(repository.update).toHaveBeenCalledWith('conn-1', {
      google_email: 'staff@gmail.com',
      provider_subject: 'google-sub-123',
      access_token: 'new-access-token',
      refresh_token: 'old-refresh-token',
      token_expiry: '2026-08-07T11:00:00.000Z',
      scope: 'openid email profile',
      status: 'active',
    });

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('old-refresh-token');
  });

  it('lists available calendars for a connection', async () => {
    repository.findById.mockResolvedValue({
      id: 'connection-id',
      access_token: 'access-token',
    });

    providersService.listCalendars.mockResolvedValue([
      { id: 'calendar-1', summary: 'Work Calendar' },
      { id: 'calendar-2', summary: 'Personal Calendar' },
    ]);

    const result = await service.listAvailableCalendars('connection-id');

    expect(providersService.listCalendars).toHaveBeenCalledWith('access-token');
    expect(result).toEqual([
      { id: 'calendar-1', summary: 'Work Calendar' },
      { id: 'calendar-2', summary: 'Personal Calendar' },
    ]);
  });

  it('throws error when listing calendars without access token', async () => {
    repository.findById.mockResolvedValue({
      id: 'connection-id',
      access_token: null,
    });

    await expect(service.listAvailableCalendars('connection-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

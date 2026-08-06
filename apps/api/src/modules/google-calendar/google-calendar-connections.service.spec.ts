import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('GoogleCalendarConnectionsService', () => {
  let service: GoogleCalendarConnectionsService;

  const repository = {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    service = new GoogleCalendarConnectionsService(repository as never);
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

    expect(repository.create).toHaveBeenCalledWith({
      user_id,
      google_email: 'user@example.com',
      provider_subject: 'google-sub-123',
      status: 'pending',
    });
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
});

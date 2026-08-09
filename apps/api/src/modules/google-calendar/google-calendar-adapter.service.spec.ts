import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleCalendarAdapterService } from './google-calendar-adapter.service';

describe('GoogleCalendarAdapterService', () => {
  let service: GoogleCalendarAdapterService;

  const provider = {
    listCalendars: vi.fn(),
    getBusyTimes: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    cancelEvent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoogleCalendarAdapterService(provider as never);
  });

  it('delegates calendar listing', async () => {
    provider.listCalendars.mockResolvedValue([{ id: 'primary', summary: 'Primary' }]);

    const result = await service.listCalendars('access-token');

    expect(provider.listCalendars).toHaveBeenCalledWith('access-token');
    expect(result[0].id).toBe('primary');
  });

  it('delegates busy time queries', async () => {
    provider.getBusyTimes.mockResolvedValue({
      primary: [{ start: 'a', end: 'b' }],
    });

    const result = await service.getBusyTimes('access-token', {
      calendar_ids: ['primary'],
      time_min: 'a',
      time_max: 'b',
    });

    expect(result.primary).toHaveLength(1);
  });

  it('delegates event creation', async () => {
    provider.createEvent.mockResolvedValue({
      id: 'event-1',
      status: 'confirmed',
      start: 'a',
      end: 'b',
    });

    const result = await service.createEvent('access-token', {
      calendar_id: 'primary',
      summary: 'Consultation',
      start: 'a',
      end: 'b',
    });

    expect(result.id).toBe('event-1');
  });

  it('delegates event update', async () => {
    provider.updateEvent.mockResolvedValue({
      id: 'event-1',
      status: 'confirmed',
      start: 'a',
      end: 'b',
    });

    const result = await service.updateEvent('access-token', 'event-1', {
      calendar_id: 'primary',
      summary: 'Updated',
      start: 'a',
      end: 'b',
    });

    expect(result.id).toBe('event-1');
  });

  it('delegates event cancellation', async () => {
    provider.cancelEvent.mockResolvedValue(undefined);

    await service.cancelEvent('access-token', 'primary', 'event-1');

    expect(provider.cancelEvent).toHaveBeenCalledWith('access-token', 'primary', 'event-1');
  });
});

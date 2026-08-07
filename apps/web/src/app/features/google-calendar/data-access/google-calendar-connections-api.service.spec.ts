import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { GoogleCalendarConnectionsApiService } from './google-calendar-connections-api.service';
import { ApiClientService } from '../../../core/api/api-client.service';

describe('GoogleCalendarConnectionsApiService', () => {
  let service: GoogleCalendarConnectionsApiService;

  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GoogleCalendarConnectionsApiService,
        { provide: ApiClientService, useValue: apiClient },
      ],
    });
    service = TestBed.inject(GoogleCalendarConnectionsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('gets current user connection', async () => {
    apiClient.get.mockReturnValue(of({ id: 'conn-1' }));

    const result = await firstValueFrom(service.getMine());

    expect(apiClient.get).toHaveBeenCalledWith('/google-calendar/connections/me');
    expect(result).toEqual(
      expect.objectContaining({
        id: 'conn-1',
      }),
    );
  });

  it('creates a new connection', async () => {
    const payload = { google_email: 'user@example.com', provider_subject: 'provider-subject-456' };

    apiClient.post.mockReturnValue(of({ id: 'conn-2' }));

    const result = await firstValueFrom(service.create(payload));

    expect(apiClient.post).toHaveBeenCalledWith('/google-calendar/connections', payload);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'conn-2',
      }),
    );
  });

  it('updates a calendar connection', async () => {
    apiClient.patch.mockReturnValue(of({ id: 'conn-1', calendar_id: 'calendar-123' }));
    const payload = {
      calendar_id: 'calendar-123',
      calendar_summary: 'Primary Calendar',
    };

    const connectionId = 'conn-1';

    const result = await firstValueFrom(service.updateCalendarSelection(connectionId, payload));

    expect(apiClient.patch).toHaveBeenCalledWith(
      `/google-calendar/connections/${connectionId}/calendar-selection`,
      payload,
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'conn-1',
        calendar_id: 'calendar-123',
      }),
    );
  });

  it('revokes a connection', async () => {
    apiClient.post.mockReturnValue(of({ id: 'conn-1', status: 'revoked' }));

    const result = await firstValueFrom(service.revoke('conn-1'));

    expect(apiClient.post).toHaveBeenCalledWith('/google-calendar/connections/conn-1/revoke', {});
    expect(result).toEqual(
      expect.objectContaining({
        id: 'conn-1',
        status: 'revoked',
      }),
    );
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';

import { GoogleCalendarConnectionsApiService } from '../../data-access/google-calendar-connections-api.service';
import { GoogleCalendarConnectionPageStore } from './google-calendar-connection-page.store';
import { DOCUMENT } from '@angular/common';

describe('GoogleCalendarConnectionPageStore', () => {
  let store: GoogleCalendarConnectionPageStore;

  const api = {
    getMine: vi.fn(),
    revoke: vi.fn(),
    authorize: vi.fn(),
    listCalendars: vi.fn(),
    updateCalendarSelection: vi.fn(),
  };

  const location = {
    assign: vi.fn(),
  };

  const activatedRoute = {
    snapshot: {
      queryParams: {},
    },
  };

  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    activatedRoute.snapshot.queryParams = {};
    TestBed.configureTestingModule({
      providers: [
        GoogleCalendarConnectionPageStore,
        { provide: GoogleCalendarConnectionsApiService, useValue: api },
        { provide: DOCUMENT, useValue: { location } },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
      ],
    });

    store = TestBed.inject(GoogleCalendarConnectionPageStore);
  });

  it('loads the current connection', async () => {
    api.getMine.mockReturnValue(
      of({
        id: 'conn-1',
        user_id: 'user-1',
        google_email: 'staff@gmail.com',
        provider_subject: 'sub-1',
        access_token: null,
        refresh_token: null,
        token_expiry: null,
        scope: null,
        calendar_id: null,
        calendar_summary: null,
        sync_token: null,
        watch_channel_id: null,
        watch_resource_id: null,
        watch_expiration: null,
        status: 'pending',
        last_synced_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
    );

    await store.load();

    expect(store.connection()?.id).toBe('conn-1');
    expect(store.isLoading()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('sets success state from oauth success query param', async () => {
    activatedRoute.snapshot.queryParams = {
      oauth: 'success',
      connectionId: 'conn-1',
    };

    api.getMine.mockReturnValue(of(null));

    await store.load();

    expect(store.successMessage()).toBe('Google Calendar connected successfully.');
    expect(router.navigate).toHaveBeenCalled();
  });

  it('sets error state from oauth error query param', async () => {
    activatedRoute.snapshot.queryParams = {
      oauth: 'error',
      reason: 'access_denied',
    };

    api.getMine.mockReturnValue(of(null));

    await store.load();

    expect(store.errorMessage()).toBe('Google Calendar authorization failed: access_denied');
    expect(router.navigate).toHaveBeenCalled();
  });

  it('sets error when load fails', async () => {
    api.getMine.mockReturnValue(throwError(() => new Error('load failed')));

    await store.load();

    expect(store.connection()).toBeNull();
    expect(store.errorMessage()).toBe('Failed to load Google Calendar connection.');
    expect(store.isLoading()).toBe(false);
  });

  it('starts oauth authorization by redirecting browser', async () => {
    api.authorize.mockReturnValue(
      of({ authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?mock=1' }),
    );

    await store.connectOrRefreshAuth();

    expect(location.assign).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth?mock=1',
    );
  });

  it('revokes the current connection', async () => {
    store.setConnectionForTest({
      id: 'conn-1',
      user_id: 'user-1',
      google_email: 'staff@gmail.com',
      provider_subject: 'sub-1',
      access_token: null,
      refresh_token: null,
      token_expiry: null,
      scope: null,
      calendar_id: null,
      calendar_summary: null,
      sync_token: null,
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
      status: 'active',
      last_synced_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    api.revoke.mockReturnValue(
      of({
        id: 'conn-1',
        user_id: 'user-1',
        google_email: 'staff@gmail.com',
        provider_subject: 'sub-1',
        access_token: null,
        refresh_token: null,
        token_expiry: null,
        scope: null,
        calendar_id: null,
        calendar_summary: null,
        sync_token: null,
        watch_channel_id: null,
        watch_resource_id: null,
        watch_expiration: null,
        status: 'revoked',
        last_synced_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
    );

    await store.revokeConnection();

    expect(store.connection()?.status).toBe('revoked');
  });

  it('loads calendars for an existing connection', async () => {
    store.setConnectionForTest({
      id: 'conn-1',
      user_id: 'user-1',
      google_email: 'staff@gmail.com',
      provider_subject: 'sub-1',
      access_token: null,
      refresh_token: null,
      token_expiry: null,
      scope: null,
      calendar_id: null,
      calendar_summary: null,
      sync_token: null,
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
      status: 'active',
      last_synced_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    api.listCalendars.mockReturnValue(
      of([
        { id: 'primary', summary: 'Primary Calendar' },
        { id: 'team', summary: 'Team Calendar' },
      ]),
    );

    await store.loadCalendars();

    expect(store.availableCalendars()).toHaveLength(2);
  });

  it('selects a calendar and updates the connection', async () => {
    store.setConnectionForTest({
      id: 'conn-1',
      user_id: 'user-1',
      google_email: 'staff@gmail.com',
      provider_subject: 'sub-1',
      access_token: null,
      refresh_token: null,
      token_expiry: null,
      scope: null,
      calendar_id: null,
      calendar_summary: null,
      sync_token: null,
      watch_channel_id: null,
      watch_resource_id: null,
      watch_expiration: null,
      status: 'active',
      last_synced_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    api.updateCalendarSelection.mockReturnValue(
      of({
        id: 'conn-1',
        user_id: 'user-1',
        google_email: 'staff@gmail.com',
        provider_subject: 'sub-1',
        access_token: null,
        refresh_token: null,
        token_expiry: null,
        scope: null,
        calendar_id: 'primary',
        calendar_summary: 'Primary Calendar',
        sync_token: null,
        watch_channel_id: null,
        watch_resource_id: null,
        watch_expiration: null,
        status: 'active',
        last_synced_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
    );

    await store.selectCalendar({
      id: 'primary',
      summary: 'Primary Calendar',
    });

    expect(store.connection()?.calendar_id).toBe('primary');
    expect(store.connection()?.calendar_summary).toBe('Primary Calendar');
  });
});

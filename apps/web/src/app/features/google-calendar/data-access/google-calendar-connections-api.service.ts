import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../../core/api/api-client.service';

export type GoogleCalendarConnectionStatus = 'pending' | 'active' | 'revoked' | 'error';

export interface GoogleCalendarConnectionRecord {
  id: string;
  user_id: string;
  google_email: string;
  provider_subject: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  scope: string | null;
  calendar_id: string | null;
  calendar_summary: string | null;
  sync_token: string | null;
  watch_channel_id: string | null;
  watch_resource_id: string | null;
  watch_expiration: string | null;
  status: GoogleCalendarConnectionStatus;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
}

export interface CreateGoogleCalendarConnectionPayload {
  google_email: string;
  provider_subject: string;
}

export interface UpdateGoogleCalendarSelectionPayload {
  calendar_id: string;
  calendar_summary: string;
}

export interface GoogleOAuthAuthorizePayload {
  return_to?: string;
}

export interface GoogleOAuthAuthorizeResponse {
  authorization_url: string;
}

export interface GoogleOAuthCallbackResult {
  success: boolean;
  return_to: string;
  connection_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarConnectionsApiService {
  private readonly apiClient = inject(ApiClientService);

  getMine(): Observable<GoogleCalendarConnectionRecord | null> {
    return this.apiClient.get<GoogleCalendarConnectionRecord | null>(
      '/google-calendar/connections/me',
    );
  }

  create(
    payload: CreateGoogleCalendarConnectionPayload,
  ): Observable<GoogleCalendarConnectionRecord> {
    return this.apiClient.post<GoogleCalendarConnectionRecord>(
      '/google-calendar/connections',
      payload,
    );
  }

  updateCalendarSelection(
    id: string,
    payload: UpdateGoogleCalendarSelectionPayload,
  ): Observable<GoogleCalendarConnectionRecord> {
    return this.apiClient.patch<GoogleCalendarConnectionRecord>(
      `/google-calendar/connections/${id}/calendar-selection`,
      payload,
    );
  }

  listCalendars(id: string): Observable<GoogleCalendarListItem[]> {
    return this.apiClient.get<GoogleCalendarListItem[]>(
      `/google-calendar/connections/${id}/calendars`,
    );
  }

  authorize(payload: GoogleOAuthAuthorizePayload): Observable<GoogleOAuthAuthorizeResponse> {
    return this.apiClient.post<GoogleOAuthAuthorizeResponse>(
      '/google-calendar/oauth/authorize',
      payload,
    );
  }

  revoke(id: string): Observable<GoogleCalendarConnectionRecord> {
    return this.apiClient.post<GoogleCalendarConnectionRecord>(
      `/google-calendar/connections/${id}/revoke`,
      {},
    );
  }
}

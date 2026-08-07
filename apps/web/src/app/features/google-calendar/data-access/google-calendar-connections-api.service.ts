import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';

export const GOOGLE_CALENDAR_CONNECTION_STATUS = ['pending', 'active', 'revoked', 'error'] as const;

export type GoogleCalendarConnectionStatus = (typeof GOOGLE_CALENDAR_CONNECTION_STATUS)[number];

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

export interface CreateGoogleCalendarConnectionPayload {
  google_email: string;
  provider_subject: string;
}

export interface UpdateGoogleCalendarSelectionPayload {
  calendar_id: string;
  calendar_summary: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarConnectionsApiService {
  private readonly apiClient = inject(ApiClientService);

  getMine() {
    return this.apiClient.get<GoogleCalendarConnectionRecord>('/google-calendar/connections/me');
  }

  create(payload: CreateGoogleCalendarConnectionPayload) {
    return this.apiClient.post<GoogleCalendarConnectionRecord>(
      '/google-calendar/connections',
      payload,
    );
  }

  updateCalendarSelection(id: string, payload: UpdateGoogleCalendarSelectionPayload) {
    return this.apiClient.patch<GoogleCalendarConnectionRecord>(
      `/google-calendar/connections/${id}/calendar-selection`,
      payload,
    );
  }

  revoke(id: string) {
    return this.apiClient.post<GoogleCalendarConnectionRecord>(
      `/google-calendar/connections/${id}/revoke`,
      {},
    );
  }
}

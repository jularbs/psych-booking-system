import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  GoogleCalendarConnectionsApiService,
  type GoogleCalendarConnectionRecord,
} from '../../data-access/google-calendar-connections-api.service';

@Injectable()
export class GoogleCalendarConnectionPageStore {
  private readonly api = inject(GoogleCalendarConnectionsApiService);
  private readonly currentConnection = signal<GoogleCalendarConnectionRecord | null>(null);
  private readonly loading = signal(true);
  private readonly submitting = signal(false);
  private readonly currentErrorMessage = signal<string | null>(null);

  readonly connection = this.currentConnection.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isSubmitting = this.submitting.asReadonly();
  readonly errorMessage = this.currentErrorMessage.asReadonly();

  async load(): Promise<void> {
    this.loading.set(true);
    this.currentErrorMessage.set(null);

    try {
      const connection = await firstValueFrom(this.api.getMine());
      this.currentConnection.set(connection);
    } catch {
      this.currentConnection.set(null);
      this.currentErrorMessage.set('Failed to load Google Calendar connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async revokeConnection(): Promise<void> {
    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const connection = this.connection();
      if (!connection) {
        throw new Error('No connection to revoke.');
      }

      const revokedConnection = await firstValueFrom(this.api.revoke(connection.id));
      this.currentConnection.set(revokedConnection);
    } catch {
      this.currentErrorMessage.set('Failed to revoke Google Calendar connection.');
    } finally {
      this.submitting.set(false);
    }
  }

  setConnectionForTest(connection: GoogleCalendarConnectionRecord | null): void {
    this.currentConnection.set(connection);
  }
}

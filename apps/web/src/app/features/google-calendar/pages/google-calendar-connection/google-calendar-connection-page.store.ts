import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GoogleCalendarConnectionRecord,
  GoogleCalendarConnectionsApiService,
  GoogleCalendarListItem,
} from '../../data-access/google-calendar-connections-api.service';

@Injectable()
export class GoogleCalendarConnectionPageStore {
  private readonly currentConnection = signal<GoogleCalendarConnectionRecord | null>(null);
  private readonly calendars = signal<GoogleCalendarListItem[]>([]);
  private readonly loading = signal(true);
  private readonly submitting = signal(false);
  private readonly currentErrorMessage = signal<string | null>(null);
  private readonly currentSuccessMessage = signal<string | null>(null);

  readonly connection = this.currentConnection.asReadonly();
  readonly availableCalendars = this.calendars.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isSubmitting = this.submitting.asReadonly();
  readonly errorMessage = this.currentErrorMessage.asReadonly();
  readonly successMessage = this.currentSuccessMessage.asReadonly();

  private readonly api = inject(GoogleCalendarConnectionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  async load(): Promise<void> {
    this.loading.set(true);
    this.currentErrorMessage.set(null);
    this.currentSuccessMessage.set(null);

    this.applyOAuthQueryState();

    try {
      const connection = await firstValueFrom(this.api.getMine());
      this.currentConnection.set(connection);

      if (connection?.status === 'active') {
        await this.loadCalendars();
      } else {
        this.calendars.set([]);
      }
    } catch {
      this.currentConnection.set(null);
      this.calendars.set([]);
      this.currentErrorMessage.set('Failed to load Google Calendar connection.');
    } finally {
      this.loading.set(false);
    }
  }

  async connectOrRefreshAuth(): Promise<void> {
    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const result = await firstValueFrom(
        this.api.authorize({
          return_to: '/google-calendar/connection',
        }),
      );

      this.document.location.assign(result.authorization_url);
    } catch {
      this.currentErrorMessage.set('Failed to start Google authorization.');
    } finally {
      this.submitting.set(false);
    }
  }

  async loadCalendars(): Promise<void> {
    const connection = this.currentConnection();

    if (!connection) {
      this.calendars.set([]);
      return;
    }

    this.currentErrorMessage.set(null);

    try {
      const calendars = await firstValueFrom(this.api.listCalendars(connection.id));
      this.calendars.set(calendars);
    } catch {
      this.calendars.set([]);
      this.currentErrorMessage.set('Failed to load Google calendars.');
    }
  }

  async selectCalendar(calendar: GoogleCalendarListItem): Promise<void> {
    const connection = this.currentConnection();

    if (!connection) {
      return;
    }

    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const updated = await firstValueFrom(
        this.api.updateCalendarSelection(connection.id, {
          calendar_id: calendar.id,
          calendar_summary: calendar.summary,
        }),
      );

      this.currentConnection.set(updated);
      this.currentSuccessMessage.set('Google Calendar selected successfully.');
    } catch {
      this.currentErrorMessage.set('Failed to select Google calendar.');
    } finally {
      this.submitting.set(false);
    }
  }

  async revokeConnection(): Promise<void> {
    const connection = this.currentConnection();

    if (!connection) {
      return;
    }

    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const updated = await firstValueFrom(this.api.revoke(connection.id));
      this.currentConnection.set(updated);
      this.calendars.set([]);
      this.currentSuccessMessage.set('Google Calendar connection revoked successfully.');
    } catch {
      this.currentErrorMessage.set('Failed to revoke Google Calendar connection.');
    } finally {
      this.submitting.set(false);
    }
  }

  setConnectionForTest(connection: GoogleCalendarConnectionRecord | null): void {
    this.currentConnection.set(connection);
  }

  private async applyOAuthQueryState(): Promise<void> {
    const queryParams = this.route.snapshot.queryParams;
    const oauthState = queryParams['oauth'];
    const reason = queryParams['reason'];

    if (oauthState === 'success') {
      this.currentSuccessMessage.set('Google Calendar connected successfully.');
      void this.clearOAuthQueryParams();
      return;
    }

    if (oauthState === 'error') {
      this.currentErrorMessage.set(
        `Google Calendar authorization failed${reason ? `: ${reason}` : '.'}`,
      );
      void this.clearOAuthQueryParams();
    }
  }

  private async clearOAuthQueryParams(): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        oauth: null,
        reason: null,
        connectionId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

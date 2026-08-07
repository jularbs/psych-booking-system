import { Component, OnInit, computed, inject } from '@angular/core';

import { GoogleCalendarListItem } from '../../data-access/google-calendar-connections-api.service';
import { GoogleCalendarConnectionPageStore } from './google-calendar-connection-page.store';

@Component({
  selector: 'app-google-calendar-connection',
  standalone: true,
  templateUrl: './google-calendar-connection.component.html',
  providers: [GoogleCalendarConnectionPageStore],
})
export class GoogleCalendarConnectionComponent implements OnInit {
  private readonly store = inject(GoogleCalendarConnectionPageStore);

  readonly connection = this.store.connection;
  readonly availableCalendars = this.store.availableCalendars;
  readonly isLoading = this.store.isLoading;
  readonly isSubmitting = this.store.isSubmitting;
  readonly errorMessage = this.store.errorMessage;

  readonly hasConnection = computed(() => !!this.connection());
  readonly hasCalendars = computed(() => this.availableCalendars().length > 0);

  ngOnInit(): void {
    void this.store.load();
  }

  async connectOrRefreshAuth(): Promise<void> {
    await this.store.connectOrRefreshAuth();
  }

  async selectCalendar(calendar: GoogleCalendarListItem): Promise<void> {
    await this.store.selectCalendar(calendar);
  }

  async revoke(): Promise<void> {
    await this.store.revokeConnection();
  }
}

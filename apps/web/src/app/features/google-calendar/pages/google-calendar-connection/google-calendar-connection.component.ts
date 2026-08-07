import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GoogleCalendarConnectionPageStore } from './google-calendar-connection-page.store';

@Component({
  selector: 'app-google-calendar-connection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-calendar-connection.component.html',
  styleUrl: './google-calendar-connection.component.css',
  providers: [GoogleCalendarConnectionPageStore],
})
export class GoogleCalendarConnectionComponent implements OnInit {
  private readonly store = inject(GoogleCalendarConnectionPageStore);

  readonly connection = this.store.connection;
  readonly isLoading = this.store.isLoading;
  readonly isSubmitting = this.store.isSubmitting;
  readonly errorMessage = this.store.errorMessage;

  ngOnInit(): void {
    this.store.load();
  }

  async revoke(): Promise<void> {
    await this.store.revokeConnection();
  }
}

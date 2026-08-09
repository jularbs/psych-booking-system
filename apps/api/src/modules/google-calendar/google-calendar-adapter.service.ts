import { Injectable } from '@nestjs/common';

import { GoogleCalendarProviderService } from './google-calendar-provider.service';
import {
  CalendarProviderBusyQuery,
  CalendarProviderEventInput,
} from './google-calendar-provider.types';

@Injectable()
export class GoogleCalendarAdapterService {
  constructor(private readonly provider: GoogleCalendarProviderService) {}

  listCalendars(accessToken: string) {
    return this.provider.listCalendars(accessToken);
  }

  getBusyTimes(accessToken: string, query: CalendarProviderBusyQuery) {
    return this.provider.getBusyTimes(accessToken, query);
  }

  createEvent(accessToken: string, input: CalendarProviderEventInput) {
    return this.provider.createEvent(accessToken, input);
  }

  updateEvent(accessToken: string, eventId: string, input: CalendarProviderEventInput) {
    return this.provider.updateEvent(accessToken, eventId, input);
  }

  cancelEvent(accessToken: string, calendarId: string, eventId: string) {
    return this.provider.cancelEvent(accessToken, calendarId, eventId);
  }
}

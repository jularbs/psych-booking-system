import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import {
  CalendarProviderBusyQuery,
  CalendarProviderEventInput,
  CalendarProviderBusySlot,
  CalendarProviderEventRecord,
} from './google-calendar-provider.types';

export const GOOGLE_CALENDAR_CLIENT_FACTORY = 'GOOGLE_CALENDAR_CLIENT_FACTORY';

export interface GoogleOAuthUserProfile {
  email: string;
  sub: string;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
  access_role?: string;
  time_zone?: string;
}

export interface GoogleCalendarRawBusyResponse {
  calendars: Record<
    string,
    {
      busy?: Array<{
        start: string;
        end: string;
      }>;
    }
  >;
}

export interface GoogleCalendarRawEventResponse {
  id?: string | null;
  status?: string | null;
  htmlLink?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: {
    dateTime?: string | null;
  } | null;
  end?: {
    dateTime?: string | null;
  } | null;
}

export interface GoogleCalendarClientFactory {
  createOAuthUserInfoClient(): {
    getProfile(accessToken: string): Promise<GoogleOAuthUserProfile>;
  };
  createCalendarClient(): {
    listCalendars(accessToken: string): Promise<GoogleCalendarListItem[]>;
    getBusyTimes(
      accessToken: string,
      query: CalendarProviderBusyQuery,
    ): Promise<GoogleCalendarRawBusyResponse>;
    createEvent(
      accessToken: string,
      input: CalendarProviderEventInput,
    ): Promise<GoogleCalendarRawEventResponse>;
    updateEvent(
      accessToken: string,
      eventId: string,
      input: CalendarProviderEventInput,
    ): Promise<GoogleCalendarRawEventResponse>;
    cancelEvent(accessToken: string, calendarId: string, eventId: string): Promise<void>;
  };
}

@Injectable()
export class GoogleCalendarProviderService {
  constructor(
    @Inject(GOOGLE_CALENDAR_CLIENT_FACTORY)
    private readonly clientFactory: GoogleCalendarClientFactory,
  ) {}

  async getProfile(accessToken: string): Promise<GoogleOAuthUserProfile> {
    const profile = await this.clientFactory.createOAuthUserInfoClient().getProfile(accessToken);

    if (!profile.email || !profile.sub) {
      throw new BadGatewayException('Incomplete Google Profile response');
    }

    return profile;
  }

  async listCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
    const calendars = await this.clientFactory.createCalendarClient().listCalendars(accessToken);

    return calendars.map((calendar) => ({
      id: calendar.id,
      summary: calendar.summary,
      primary: calendar.primary,
      access_role: calendar.access_role,
      time_zone: calendar.time_zone,
    }));
  }

  async getBusyTimes(
    accessToken: string,
    query: CalendarProviderBusyQuery,
  ): Promise<Record<string, CalendarProviderBusySlot[]>> {
    const response = await this.clientFactory
      .createCalendarClient()
      .getBusyTimes(accessToken, query);

    const normalized: Record<string, CalendarProviderBusySlot[]> = {};

    for (const [calendarId, details] of Object.entries(response.calendars ?? {})) {
      normalized[calendarId] = (details.busy ?? [])
        .filter((slot) => !!slot.start && !!slot.end)
        .map((slot) => ({
          start: slot.start,
          end: slot.end,
        }));
    }
    return normalized;
  }

  async createEvent(
    accessToken: string,
    input: CalendarProviderEventInput,
  ): Promise<CalendarProviderEventRecord> {
    const response = await this.clientFactory
      .createCalendarClient()
      .createEvent(accessToken, input);
    return this.normalizeEvent(response);
  }

  async updateEvent(
    accessToken: string,
    eventId: string,
    input: CalendarProviderEventInput,
  ): Promise<CalendarProviderEventRecord> {
    const response = await this.clientFactory
      .createCalendarClient()
      .updateEvent(accessToken, eventId, input);
    return this.normalizeEvent(response);
  }

  async cancelEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
    await this.clientFactory.createCalendarClient().cancelEvent(accessToken, calendarId, eventId);
  }

  private normalizeEvent(response: GoogleCalendarRawEventResponse): CalendarProviderEventRecord {
    if (!response.id || !response.status || !response.start?.dateTime || !response.end?.dateTime) {
      throw new BadGatewayException('Incomplete Google Event response');
    }

    return {
      id: response.id,
      status: response.status,
      html_link: response.htmlLink ?? null,
      summary: response.summary ?? null,
      description: response.description ?? null,
      start: response.start.dateTime,
      end: response.end.dateTime,
    };
  }
}

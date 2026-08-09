export interface CalendarProviderCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  access_role?: string;
  time_zone?: string;
}

export interface CalendarProviderBusySlot {
  start: string;
  end: string;
}

export interface CalendarProviderEventInput {
  calendar_id: string;
  summary: string;
  description?: string | null;
  start: string;
  end: string;
  time_zone?: string | null;
  attendees?: Array<{
    email: string;
    display_name?: string | null;
  }>;
  location?: string | null;
}

export interface CalendarProviderEventRecord {
  id: string;
  status: string;
  html_link?: string | null;
  summary?: string | null;
  description?: string | null;
  start: string;
  end: string;
}

export interface CalendarProviderBusyQuery {
  calendar_ids: string[];
  time_min: string;
  time_max: string;
  time_zone?: string | null;
}

export interface GoogleCalendarProviderAdapter {
  listCalendars(accessToken: string): Promise<CalendarProviderCalendar[]>;
  getBusyTimes(
    accessToken: string,
    query: CalendarProviderBusyQuery,
  ): Promise<Record<string, CalendarProviderBusySlot[]>>;
  createEvent(
    accessToken: string,
    input: CalendarProviderEventInput,
  ): Promise<CalendarProviderEventRecord>;
  updateEvent(
    accessToken: string,
    eventId: string,
    input: CalendarProviderEventInput,
  ): Promise<CalendarProviderEventRecord>;
  cancelEvent(accessToken: string, calendarId: string, eventId: string): Promise<void>;
}

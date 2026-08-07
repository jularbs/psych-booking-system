import { Inject, Injectable } from '@nestjs/common';

export const GOOGLE_CALENDAR_CLIENT_FACTORY = 'GOOGLE_CALENDAR_CLIENT_FACTORY';

export interface GoogleOAuthUserProfile {
  email: string;
  sub: string;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
}

export interface GoogleCalendarClientFactory {
  createOAuthUserInfoClient(): {
    getProfile(accessToken: string): Promise<GoogleOAuthUserProfile>;
  };
  createCalendarClient(): {
    listCalendars(accessToken: string): Promise<GoogleCalendarListItem[]>;
  };
}

@Injectable()
export class GoogleCalendarProviderService {
  constructor(
    @Inject(GOOGLE_CALENDAR_CLIENT_FACTORY)
    private readonly clientFactory: GoogleCalendarClientFactory,
  ) {}

  getProfile(accessToken: string): Promise<GoogleOAuthUserProfile> {
    return this.clientFactory.createOAuthUserInfoClient().getProfile(accessToken);
  }

  listCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
    return this.clientFactory.createCalendarClient().listCalendars(accessToken);
  }
}

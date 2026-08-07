import { BadGatewayException, Inject, Injectable } from '@nestjs/common';

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

  async getProfile(accessToken: string): Promise<GoogleOAuthUserProfile> {
    const profile = await this.clientFactory.createOAuthUserInfoClient().getProfile(accessToken);

    if (!profile.email || !profile.sub) {
      throw new BadGatewayException('Incomplete Google Profile response');
    }

    return profile;
  }

  listCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
    return this.clientFactory.createCalendarClient().listCalendars(accessToken);
  }
}

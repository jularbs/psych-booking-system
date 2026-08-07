import { Module } from '@nestjs/common';

import { GoogleCalendarConnectionsController } from './google-calendar-connections.controller';
import { GoogleCalendarConnectionsRepository } from './google-calendar-connections.repository';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleOAuthStateService } from './google-oauth-state.service';
import { GoogleCalendarOAuthController } from './google-calendar-oauth.controller';
import {
  GOOGLE_OAUTH_RUNTIME_CONFIG,
  GOOGLE_OAUTH_CLIENT_FACTORY,
  GoogleOAuthService,
} from './google-oauth.service';
import {
  GOOGLE_CALENDAR_CLIENT_FACTORY,
  GoogleCalendarProviderService,
} from './google-calendar-provider.service';
import { getGoogleOAuthConfig } from '../../common/config/google-oauth.config';

@Module({
  controllers: [GoogleCalendarConnectionsController, GoogleCalendarOAuthController],
  providers: [
    GoogleCalendarConnectionsRepository,
    GoogleCalendarConnectionsService,
    GoogleOAuthService,
    GoogleCalendarProviderService,
    GoogleOAuthStateService,
    {
      provide: GOOGLE_OAUTH_RUNTIME_CONFIG,
      useFactory: () => getGoogleOAuthConfig(process.env),
    },
    {
      provide: GOOGLE_OAUTH_CLIENT_FACTORY,
      useValue: {
        create: () => ({
          generateAuthUrl: () => {
            throw new Error('Not implemented');
          },
          getToken: async () => {
            throw new Error('Not implemented');
          },
        }),
      },
    },
    {
      provide: GOOGLE_CALENDAR_CLIENT_FACTORY,
      useValue: {
        createOAuthUserInfoClient: () => ({
          getProfile: async () => {
            throw new Error('GOOGLE_CALENDAR_CLIENT_FACTORY getProfile not implemented yet');
          },
        }),
        createCalendarClient: () => ({
          listCalendars: async () => {
            throw new Error('GOOGLE_CALENDAR_CLIENT_FACTORY listCalendars not implemented yet');
          },
        }),
      },
    },
  ],
  exports: [GoogleCalendarConnectionsService],
})
export class GoogleCalendarModule {}

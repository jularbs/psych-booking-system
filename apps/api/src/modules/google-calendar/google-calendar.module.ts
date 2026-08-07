import { Module } from '@nestjs/common';
import { google } from 'googleapis';

import { GoogleCalendarConnectionsController } from './google-calendar-connections.controller';
import { GoogleCalendarConnectionsRepository } from './google-calendar-connections.repository';
import { GoogleCalendarConnectionsService } from './google-calendar-connections.service';
import { GoogleOAuthStateService } from './google-oauth-state.service';
import { GoogleCalendarOAuthController } from './google-calendar-oauth.controller';
import {
  GOOGLE_OAUTH_CLIENT_FACTORY,
  GOOGLE_OAUTH_RUNTIME_CONFIG,
  GoogleOAuthClientFactory,
  GoogleOAuthRuntimeConfig,
  GoogleOAuthService,
} from './google-oauth.service';
import {
  GOOGLE_CALENDAR_CLIENT_FACTORY,
  GoogleCalendarClientFactory,
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
      inject: [GOOGLE_OAUTH_RUNTIME_CONFIG],
      useFactory: (config: GoogleOAuthRuntimeConfig): GoogleOAuthClientFactory => ({
        create: () => {
          const client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri,
          );

          return {
            generateAuthUrl: (options: Record<string, unknown>) =>
              client.generateAuthUrl(options as Parameters<typeof client.generateAuthUrl>[0]),
            getToken: async (code: string) => client.getToken(code),
          };
        },
      }),
    },
    {
      provide: GOOGLE_CALENDAR_CLIENT_FACTORY,
      inject: [GOOGLE_OAUTH_RUNTIME_CONFIG],
      useFactory: (config: GoogleOAuthRuntimeConfig): GoogleCalendarClientFactory => ({
        createOAuthUserInfoClient: () => ({
          getProfile: async (accessToken: string) => {
            const auth = new google.auth.OAuth2(
              config.clientId,
              config.clientSecret,
              config.redirectUri,
            );
            auth.setCredentials({ access_token: accessToken });

            const oauth2 = google.oauth2({
              version: 'v2',
              auth,
            });
            const response = await oauth2.userinfo.get();

            return {
              email: response.data.email ?? '',
              sub: response.data.id ?? '',
            };
          },
        }),
        createCalendarClient: () => ({
          listCalendars: async (accessToken: string) => {
            const auth = new google.auth.OAuth2(
              config.clientId,
              config.clientSecret,
              config.redirectUri,
            );
            auth.setCredentials({ access_token: accessToken });

            const calendar = google.calendar({
              version: 'v3',
              auth,
            });
            const response = await calendar.calendarList.list({
              maxResults: 250,
            });

            return (response.data.items ?? [])
              .filter((item) => !!item.id && !!item.summary)
              .map((item) => ({
                id: item.id as string,
                summary: item.summary as string,
              }));
          },
        }),
      }),
    },
  ],
  exports: [GoogleCalendarConnectionsService],
})
export class GoogleCalendarModule {}

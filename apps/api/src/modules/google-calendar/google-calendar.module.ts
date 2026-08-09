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
import { GoogleOAuthRedirectService } from './google-oauth-redirect.service';
import {
  CalendarProviderBusyQuery,
  CalendarProviderEventInput,
} from './google-calendar-provider.types';
import { GoogleCalendarAdapterService } from './google-calendar-adapter.service';

@Module({
  controllers: [GoogleCalendarConnectionsController, GoogleCalendarOAuthController],
  providers: [
    GoogleCalendarConnectionsRepository,
    GoogleCalendarConnectionsService,
    GoogleOAuthService,
    GoogleCalendarProviderService,
    GoogleOAuthStateService,
    GoogleOAuthRedirectService,
    GoogleCalendarAdapterService,
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
          async listCalendars(accessToken: string) {
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
                primary: item.primary ?? false,
                access_role: item.accessRole ?? undefined,
                time_zone: item.timeZone ?? undefined,
              }));
          },
          async getBusyTimes(accessToken: string, query: CalendarProviderBusyQuery) {
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
            const response = await calendar.freebusy.query({
              requestBody: {
                timeMin: query.time_min,
                timeMax: query.time_max,
                timeZone: query.time_zone ?? undefined,
                items: query.calendar_ids.map((id) => ({ id })),
              },
            });

            const calendars = Object.fromEntries(
              Object.entries(response.data.calendars ?? {}).map(([calendarId, details]) => [
                calendarId,
                {
                  busy: (details?.busy ?? [])
                    .filter((slot) => !!slot.start && !!slot.end)
                    .map((slot) => ({
                      start: slot.start as string,
                      end: slot.end as string,
                    })),
                },
              ]),
            );

            return { calendars };
          },
          async createEvent(accessToken: string, input: CalendarProviderEventInput) {
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
            const response = await calendar.events.insert({
              calendarId: input.calendar_id,
              requestBody: {
                summary: input.summary,
                description: input.description ?? undefined,
                start: {
                  dateTime: input.start,
                  timeZone: input.time_zone ?? undefined,
                },
                end: {
                  dateTime: input.end,
                  timeZone: input.time_zone ?? undefined,
                },
                attendees: input.attendees?.map((attendee) => ({
                  email: attendee.email,
                  displayName: attendee.display_name ?? undefined,
                })),
                location: input.location ?? undefined,
              },
            });

            return {
              id: response.data.id ?? '',
              status: response.data.status ?? '',
              htmlLink: response.data.htmlLink ?? undefined,
              summary: response.data.summary ?? undefined,
              description: response.data.description ?? undefined,
              start: {
                dateTime: response.data.start?.dateTime ?? '',
              },
              end: {
                dateTime: response.data.end?.dateTime ?? '',
              },
            };
          },
          async updateEvent(
            accessToken: string,
            eventId: string,
            input: CalendarProviderEventInput,
          ) {
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
            const response = await calendar.events.update({
              calendarId: input.calendar_id,
              eventId,
              requestBody: {
                summary: input.summary,
                description: input.description ?? undefined,
                start: {
                  dateTime: input.start,
                  timeZone: input.time_zone ?? undefined,
                },
                end: {
                  dateTime: input.end,
                  timeZone: input.time_zone ?? undefined,
                },
                attendees: input.attendees?.map((attendee) => ({
                  email: attendee.email,
                  displayName: attendee.display_name ?? undefined,
                })),
                location: input.location ?? undefined,
              },
            });

            return {
              id: response.data.id ?? '',
              status: response.data.status ?? '',
              htmlLink: response.data.htmlLink ?? undefined,
              summary: response.data.summary ?? undefined,
              description: response.data.description ?? undefined,
              start: {
                dateTime: response.data.start?.dateTime ?? '',
              },
              end: {
                dateTime: response.data.end?.dateTime ?? '',
              },
            };
          },
          async cancelEvent(accessToken: string, calendarId: string, eventId: string) {
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
            await calendar.events.delete({
              calendarId,
              eventId,
            });
          },
        }),
      }),
    },
  ],
  exports: [
    GoogleCalendarConnectionsService,
    GoogleCalendarProviderService,
    GoogleCalendarAdapterService,
  ],
})
export class GoogleCalendarModule {}

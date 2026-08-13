import { TestAppContext } from './create-test-app';
import { GOOGLE_OAUTH_CLIENT_FACTORY } from '../modules/google-calendar/google-oauth.service';
import { GOOGLE_CALENDAR_CLIENT_FACTORY } from '../modules/google-calendar/google-calendar-provider.service';
import { vi } from 'vitest';

interface BusyTime {
  start: string;
  end: string;
}

interface CalendarSummary {
  id: string;
  summary: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
}

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  id_token: string;
}

export interface SetupGoogleIntegrationMocksOptions {
  busyTimes?: BusyTime[];
  calendars?: CalendarSummary[];
  profile?: GoogleProfile;
  tokens?: OAuthTokens;
}

export function setupGoogleIntegrationMocks(
  context: TestAppContext,
  options: SetupGoogleIntegrationMocksOptions = {},
) {
  const busyTimes = options.busyTimes ?? [
    {
      start: '2026-08-10T02:00:00.000Z',
      end: '2026-08-10T02:30:00.000Z',
    },
  ];

  const calendars = options.calendars ?? [];
  const profile = options.profile ?? {
    sub: 'google-sub-123',
    email: 'staff@gmail.com',
  };
  const tokens = options.tokens ?? {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expiry_date: 1780000000000,
    scope: 'openid email profile',
    id_token: 'id-token',
  };

  const calendarFactory = context.app.get(GOOGLE_CALENDAR_CLIENT_FACTORY) as {
    createCalendarClient: ReturnType<typeof vi.fn>;
    createOAuthUserInfoClient: ReturnType<typeof vi.fn>;
  };

  calendarFactory.createCalendarClient = vi.fn().mockReturnValue({
    listCalendars: vi.fn().mockResolvedValue(calendars),
    getBusyTimes: vi.fn().mockResolvedValue({
      calendars: {
        primary: {
          busy: busyTimes,
        },
      },
    }),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    cancelEvent: vi.fn(),
  });

  calendarFactory.createOAuthUserInfoClient = vi.fn().mockReturnValue({
    getProfile: vi.fn().mockResolvedValue(profile),
  });

  const oauthFactory = context.app.get(GOOGLE_OAUTH_CLIENT_FACTORY) as {
    create: ReturnType<typeof vi.fn>;
  };

  oauthFactory.create = vi.fn().mockReturnValue({
    generateAuthUrl: vi.fn().mockImplementation((authOptions: Record<string, unknown>) => {
      const state = String(authOptions.state ?? '');
      return `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(state)}`;
    }),
    getToken: vi.fn().mockResolvedValue({
      tokens,
    }),
  });

  return { calendarFactory, oauthFactory };
}

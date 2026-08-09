import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GOOGLE_CALENDAR_CLIENT_FACTORY } from './google-calendar-provider.service';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';
import { GOOGLE_OAUTH_CLIENT_FACTORY } from './google-oauth.service';

describe('Google calendar oauth integration', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();

    const calendarFactory = context.app.get(GOOGLE_CALENDAR_CLIENT_FACTORY) as {
      createOAuthUserInfoClient: ReturnType<typeof vi.fn>;
      createCalendarClient: ReturnType<typeof vi.fn>;
    };

    calendarFactory.createOAuthUserInfoClient = vi.fn().mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({
        sub: 'google-sub-123',
        email: 'staff@gmail.com',
      }),
    });

    calendarFactory.createCalendarClient = vi.fn().mockReturnValue({
      listCalendars: vi.fn().mockResolvedValue([]),
      getBusyTimes: vi.fn().mockResolvedValue({
        calendars: {
          primary: {
            busy: [
              {
                start: '2026-08-10T01:00:00.000Z',
                end: '2026-08-10T02:00:00.000Z',
              },
            ],
          },
        },
      }),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      cancelEvent: vi.fn(),
    });

    const oauthFactory = context.app.get(GOOGLE_OAUTH_CLIENT_FACTORY) as {
      create: ReturnType<typeof vi.fn>;
    };

    oauthFactory.create = vi.fn().mockReturnValue({
      generateAuthUrl: vi.fn().mockImplementation((options: Record<string, unknown>) => {
        const state = String(options.state ?? '');
        return `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(state)}`;
      }),
      getToken: vi.fn().mockResolvedValue({
        tokens: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expiry_date: 1780000000000,
          scope: 'openid email profile',
          id_token: 'id-token',
        },
      }),
    });
  });

  beforeEach(async () => {
    await resetTestDb(context.db);
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('queries availability for the current user', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const authorize = await request(context.app.getHttpServer())
      .post('/google-calendar/oauth/authorize')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        return_to: '/google-calendar/connection',
      })
      .expect(201);

    const authorization_url = authorize.body.data.authorization_url as string;
    const state = new URL(authorization_url).searchParams.get('state');

    expect(state).toBeTruthy();

    const callbackResponse = await request(context.app.getHttpServer())
      .get('/google-calendar/oauth/callback')
      .query({
        code: 'auth-code',
        state: state as string,
      })
      .expect(302);

    expect(callbackResponse.headers.location).toContain(
      '/google-calendar/connection?oauth=success',
    );

    const me = await request(context.app.getHttpServer())
      .get('/google-calendar/connections/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    const connectionId = me.body.data.id as string;

    await request(context.app.getHttpServer())
      .patch(`/google-calendar/connections/${connectionId}/calendar-selection`)
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        calendar_id: 'primary',
        calendar_summary: 'Primary Calendar',
      })
      .expect(200);

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/availability/query')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        time_min: '2026-08-10T00:00:00.000Z',
        time_max: '2026-08-11T00:00:00.000Z',
      });

    expect(response.body.data).toEqual({
      calendar_id: 'primary',
      busy_times: [
        {
          start: '2026-08-10T01:00:00.000Z',
          end: '2026-08-10T02:00:00.000Z',
        },
      ],
    });
  });

  it('rejects query when no calendar connection exists for the user', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@gmail.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const authorize = await request(context.app.getHttpServer())
      .post('/google-calendar/oauth/authorize')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        return_to: '/google-calendar/connection',
      })
      .expect(201);

    const authorization_url = authorize.body.data.authorization_url as string;
    const state = new URL(authorization_url).searchParams.get('state');

    expect(state).toBeTruthy();

    const callbackResponse = await request(context.app.getHttpServer())
      .get('/google-calendar/oauth/callback')
      .query({
        code: 'auth-code',
        state: state as string,
      })
      .expect(302);

    expect(callbackResponse.headers.location).toContain(
      '/google-calendar/connection?oauth=success',
    );

    await request(context.app.getHttpServer())
      .post('/google-calendar/availability/query')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        time_min: '2026-08-10T00:00:00.000Z',
        time_max: '2026-08-11T00:00:00.000Z',
      })
      .expect(409);
  });

  it('forbids unauthenticated to query availability', async () => {
    await request(context.app.getHttpServer())
      .post('/google-calendar/availability/query')
      .send({
        time_min: '2026-08-10T00:00:00.000Z',
        time_max: '2026-08-11T00:00:00.000Z',
      })
      .expect(401);
  });

  it('forbids non-staff users to query availability', async () => {
    const client = await createAuthenticatedUser(context.app, {
      email: 'guest@example.com',
      password: 'Password123!',
      role: 'GUEST',
    });
    await request(context.app.getHttpServer())
      .post('/google-calendar/availability/query')
      .set('Authorization', `Bearer ${client.access_token}`)
      .send({
        time_min: '2026-08-10T00:00:00.000Z',
        time_max: '2026-08-11T00:00:00.000Z',
      })
      .expect(403);
  });

  it('rejects invalid request payload', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/google-calendar/availability/query')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        time_min: 'invalid-date',
        time_max: '2026-08-11T00:00:00.000Z',
      })
      .expect(400);
  });
});

import request from 'supertest';

import { TestAppContext, createTestApp } from '../../test-utils/create-test-app';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { GOOGLE_CALENDAR_CLIENT_FACTORY } from '../google-calendar/google-calendar-provider.service';
import { resetTestDb } from '../../test-utils/reset-test-db';
import { GOOGLE_OAUTH_CLIENT_FACTORY } from '../google-calendar/google-oauth.service';

describe('Availability Integration Tests', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();

    const calendarFactory = context.app.get(GOOGLE_CALENDAR_CLIENT_FACTORY) as {
      createCalendarClient: ReturnType<typeof vi.fn>;
      createOAuthUserInfoClient: ReturnType<typeof vi.fn>;
    };

    calendarFactory.createCalendarClient = vi.fn().mockReturnValue({
      listCalendars: vi.fn().mockResolvedValue([]),
      getBusyTimes: vi.fn().mockResolvedValue({
        calendars: {
          primary: {
            busy: [
              {
                start: '2026-08-10T02:00:00.000Z',
                end: '2026-08-10T02:30:00.000Z',
              },
            ],
          },
        },
      }),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      cancelEvent: vi.fn(),
    });

    calendarFactory.createOAuthUserInfoClient = vi.fn().mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({
        sub: 'google-sub-123',
        email: 'staff@gmail.com',
      }),
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

  afterAll(async () => {
    await context.app.close();
  });

  beforeEach(async () => {
    await resetTestDb(context.db);
  });

  it('generates slots based on availability rules and Google Calendar busy times', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const authorize = await request(context.app.getHttpServer())
      .post('/google-calendar/oauth/authorize')
      .set('Authorization', `Bearer ${user.access_token}`)
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
      .set('Authorization', `Bearer ${user.access_token}`)
      .expect(200);

    const connectionId = me.body.data.id as string;

    await request(context.app.getHttpServer())
      .patch(`/google-calendar/connections/${connectionId}/calendar-selection`)
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        calendar_id: 'primary',
        calendar_summary: 'Primary Calendar',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '12:00:00',
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/query')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        time_min: '2026-08-10T00:00:00.000Z',
        time_max: '2026-08-11T00:00:00.000Z',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      })
      .expect(201);

    expect(response.body.data.slots).toEqual([
      {
        start: '2026-08-10T01:00:00.000Z',
        end: '2026-08-10T01:30:00.000Z',
      },
      {
        start: '2026-08-10T01:30:00.000Z',
        end: '2026-08-10T02:00:00.000Z',
      },
      {
        start: '2026-08-10T02:30:00.000Z',
        end: '2026-08-10T03:00:00.000Z',
      },
      {
        start: '2026-08-10T03:00:00.000Z',
        end: '2026-08-10T03:30:00.000Z',
      },
      {
        start: '2026-08-10T03:30:00.000Z',
        end: '2026-08-10T04:00:00.000Z',
      },
    ]);
  });

  it('forbids customers from querying availability slots', async () => {
    const customer = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123!',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/query')
      .set('Authorization', `Bearer ${customer.access_token}`)
      .send({
        time_min: '2026-08-10T00:00:00.000Z',
        time_max: '2026-08-11T00:00:00.000Z',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      })
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('rejects invalid slot request payload', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/query')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        time_min: 'invalid',
        time_max: '2026-08-11T00:00:00.000Z',
        slot_duration_minutes: 30,
        slot_interval_minutes: 30,
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});

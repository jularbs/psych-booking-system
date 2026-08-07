import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GOOGLE_CALENDAR_CLIENT_FACTORY } from './google-calendar-provider.service';
import { GOOGLE_OAUTH_CLIENT_FACTORY } from './google-oauth.service';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';

describe('Google calendar oauth integration', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();
    const oauthFactory = context.app.get(GOOGLE_OAUTH_CLIENT_FACTORY) as {
      create: ReturnType<typeof vi.fn>;
    };
    const calendarFactory = context.app.get(GOOGLE_CALENDAR_CLIENT_FACTORY) as {
      createOAuthUserInfoClient: ReturnType<typeof vi.fn>;
      createCalendarClient: ReturnType<typeof vi.fn>;
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

    calendarFactory.createOAuthUserInfoClient = vi.fn().mockReturnValue({
      getProfile: vi.fn().mockResolvedValue({
        sub: 'google-sub-123',
        email: 'staff@gmail.com',
      }),
    });

    calendarFactory.createCalendarClient = vi.fn().mockReturnValue({
      listCalendars: vi.fn().mockResolvedValue([
        { id: 'primary', summary: 'Primary Calendar' },
        { id: 'team', summary: 'Team Calendar' },
      ]),
    });
  });

  beforeEach(async () => {
    await resetTestDb(context.db);
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('returns authorization url', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123',
      role: 'ASSISTANT',
    });

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/oauth/authorize')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        return_to: '/google-calendar/connection',
      });

    expect(response.body.data.authorization_url).toContain(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
  });

  it('handles oauth callback and persists connection', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123',
      role: 'ASSISTANT',
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
      .expect(200);

    expect(callbackResponse.body.data.success).toBe(true);
    expect(callbackResponse.body.data.connection_id).toBeTypeOf('string');

    const connectionResponse = await request(context.app.getHttpServer())
      .get('/google-calendar/connections/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(connectionResponse.body.data.google_email).toBe('staff@gmail.com');
    expect(connectionResponse.body.data.status).toBe('active');
  });

  it('lists calendars for a connection', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123',
      role: 'ASSISTANT',
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

    const callbackResponse = await request(context.app.getHttpServer())
      .get('/google-calendar/oauth/callback')
      .query({
        code: 'auth-code',
        state,
      })
      .expect(200);

    const connection_id = callbackResponse.body.data.connection_id as string;

    const response = await request(context.app.getHttpServer())
      .get(`/google-calendar/connections/${connection_id}/calendars`)
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].id).toBe('primary');
  });

  it('rejects invalid oauth callback state', async () => {
    await request(context.app.getHttpServer())
      .get('/google-calendar/oauth/callback')
      .query({
        code: 'auth-code',
        state: 'bad-state',
      })
      .expect(401);
  });

  it('forbids patient access to oauth authorize', async () => {
    const customer = await createAuthenticatedUser(context.app, {
      email: 'customer@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    await request(context.app.getHttpServer())
      .post('/google-calendar/oauth/authorize')
      .set('Authorization', `Bearer ${customer.access_token}`)
      .send({
        return_to: '/google-calendar/connection',
      })
      .expect(403);
  });
});

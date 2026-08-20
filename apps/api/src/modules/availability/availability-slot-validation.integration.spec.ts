import request from 'supertest';
import { DateTime } from 'luxon';
import { TestAppContext, createTestApp } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';
import { setupGoogleIntegrationMocks } from '../../test-utils/google-calendar-test-helpers';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
describe('Availability Slot Validation Integration', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();

    setupGoogleIntegrationMocks(context, {
      busyTimes: [
        {
          start: DateTime.fromISO('2026-08-10T10:00:00', { zone: 'Asia/Manila' })
            .toUTC()
            .toISO() as string,
          end: DateTime.fromISO('2026-08-10T10:30:00', { zone: 'Asia/Manila' })
            .toUTC()
            .toISO() as string,
        },
      ],
    });
  });

  afterAll(async () => {
    await context.app.close();
  });

  beforeEach(async () => {
    await resetTestDb(context.db);
  });

  it('should validate an availability slot successfully', async () => {
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
        time_zone: 'Asia/Manila',
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/validate')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        start: DateTime.fromISO('2026-08-10T09:00:00', { zone: 'Asia/Manila' }).toISO(),
        end: DateTime.fromISO('2026-08-10T10:00:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(201);

    expect(response.body.data).toEqual({
      isValid: true,
      reason: null,
    });
  });

  it('should return invalid for a slot that overlaps with a busy time', async () => {
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
        time_zone: 'Asia/Manila',
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/validate')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        start: DateTime.fromISO('2026-08-10T09:30:00', { zone: 'Asia/Manila' }).toISO(),
        end: DateTime.fromISO('2026-08-10T10:30:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(201);

    expect(response.body.data).toEqual({
      isValid: false,
      reason: 'slot_overlaps_google_busy_time',
    });
  });

  it('should return invalid for a slot that is outside of the availability window', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
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
        time_zone: 'Asia/Manila',
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/validate')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        start: DateTime.fromISO('2026-08-10T08:00:00', { zone: 'Asia/Manila' }).toISO(),
        end: DateTime.fromISO('2026-08-10T09:00:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(201);

    expect(response.body.data).toEqual({
      isValid: false,
      reason: 'slot_outside_availability_window',
    });
  });

  it('should return invalid for a slot that overlaps with a blackout window', async () => {
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
        end_time: '17:00:00',
        time_zone: 'Asia/Manila',
      })
      .expect(201);

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        rule_type: 'blackout_window',
        date_start: DateTime.fromISO('2026-08-10T12:30:00', { zone: 'Asia/Manila' }).toISO(),
        date_end: DateTime.fromISO('2026-08-10T13:30:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .post('/availability/slots/validate')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        start: DateTime.fromISO('2026-08-10T13:00:00', { zone: 'Asia/Manila' }).toISO(),
        end: DateTime.fromISO('2026-08-10T14:00:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(201);

    expect(response.body.data).toEqual({
      isValid: false,
      reason: 'slot_overlaps_blackout_window',
    });
  });

  it('forbids access to validate slot for unauthorized users', async () => {
    await request(context.app.getHttpServer())
      .post('/availability/slots/validate')
      .send({
        start: DateTime.fromISO('2026-08-10T09:00:00', { zone: 'Asia/Manila' }).toISO(),
        end: DateTime.fromISO('2026-08-10T10:00:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(401);
  });

  it('forbids customers from validating availability slots', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123!',
      role: 'PATIENT',
    });

    await request(context.app.getHttpServer())
      .post('/availability/slots/validate')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        start: DateTime.fromISO('2026-08-10T09:00:00', { zone: 'Asia/Manila' }).toISO(),
        end: DateTime.fromISO('2026-08-10T10:00:00', { zone: 'Asia/Manila' }).toISO(),
      })
      .expect(403);
  });
});

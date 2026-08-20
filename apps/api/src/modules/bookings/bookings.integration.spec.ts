import request from 'supertest';
import { DateTime } from 'luxon';
import { TestAppContext, createTestApp } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';
import { setupGoogleIntegrationMocks } from '../../test-utils/google-calendar-test-helpers';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
describe('Bookings Integration', () => {
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

    const service = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        slug: 'initial-consult',
        name: 'Initial Consultation',
        duration_minutes: 30,
        price_amount: '2500.00',
        currency: 'PHP',
        is_active: true,
      })
      .expect(201);

    const serviceId = service.body.data.id as string;

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
        start_time: '08:00:00',
        end_time: '17:00:00',
        time_zone: 'Asia/Manila',
      })
      .expect(201);

    const bookingDto = {
      service_id: serviceId,
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: DateTime.fromISO('2026-08-10T11:00', { zone: 'Asia/Manila' }).toISO() as string,
      ends_at: DateTime.fromISO('2026-08-10T11:30', { zone: 'Asia/Manila' }).toISO() as string,
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      ...bookingDto,
      starts_at: DateTime.fromISO(bookingDto.starts_at).toUTC().toISO(),
      ends_at: DateTime.fromISO(bookingDto.ends_at).toUTC().toISO(),
      status: 'pending',
    });
  });

  it('rejects booking when slot is no longer available', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const service = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send({
        slug: 'initial-consult',
        name: 'Initial Consultation',
        duration_minutes: 30,
        price_amount: '2500.00',
        currency: 'PHP',
        is_active: true,
      })
      .expect(201);

    const serviceId = service.body.data.id as string;

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
        start_time: '08:00:00',
        end_time: '17:00:00',
        time_zone: 'Asia/Manila',
      })
      .expect(201);

    const bookingDto = {
      service_id: serviceId,
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: DateTime.fromISO('2026-08-10T10:00', { zone: 'Asia/Manila' }).toISO() as string,
      ends_at: DateTime.fromISO('2026-08-10T10:30', { zone: 'Asia/Manila' }).toISO() as string,
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(400);
  });

  it('forbids customers from creating bookings using internal api endpoints', async () => {
    const patient = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PATIENT',
    });

    const bookingDto = {
      service_id: '00000000-0000-0000-0000-000000000000',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: DateTime.fromISO('2026-08-10T11:00', { zone: 'Asia/Manila' }).toISO() as string,
      ends_at: DateTime.fromISO('2026-08-10T11:30', { zone: 'Asia/Manila' }).toISO() as string,
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${patient.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(403);
  });

  it('rejects booking when start or end time is invalid', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const bookingDto = {
      service_id: '00000000-0000-0000-0000-000000000000',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: 'invalid-start-time',
      ends_at: 'invalid-end-time',
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(400);
  });

  it('rejects booking when start or end time is not ISO 8601', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const bookingDto = {
      service_id: '00000000-0000-0000-0000-000000000000',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2026-08-10 10:00', // Not ISO 8601
      ends_at: '2026-08-10 10:30', // Not ISO 8601
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(400);
  });

  it('rejects booking when start or end time has no offset', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const bookingDto = {
      service_id: '00000000-0000-0000-0000-000000000000',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2026-08-10T10:00', // No Offset
      ends_at: '2026-08-10T10:30', // No Offset
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(400);
  });

  it('rejects booking when end time is before start time', async () => {
    const user = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const bookingDto = {
      service_id: '00000000-0000-0000-0000-000000000000',
      customer_name: 'John Doe',
      customer_email: 'patient@example.com',
      starts_at: '2026-08-10T10:30:00.000Z', // No Offset
      ends_at: '2026-08-10T10:00:00.000Z', // No Offset
      time_zone: 'Asia/Manila',
      notes: 'Initial consultation for therapy.',
    };

    const response = await request(context.app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${user.access_token}`)
      .send(bookingDto);

    expect(response.status).toBe(400);
  });
});

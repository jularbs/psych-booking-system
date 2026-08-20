import request from 'supertest';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';
import { DateTime } from 'luxon';

describe('Availability rules integration tests', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetTestDb(context.db);
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('creates a new weekly window availability rule for the current user', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Weekly availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        time_zone: 'Asia/Manila',
        is_active: true,
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      description: 'Weekly availability',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00:00',
      end_time: '17:00:00',
      time_zone: 'Asia/Manila',
      is_active: true,
    });
  });

  it('creates a new weekly window availability rule for the current user with Asia/Manila as default', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Weekly availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      description: 'Weekly availability',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00:00',
      end_time: '17:00:00',
      time_zone: 'Asia/Manila',
      is_active: true,
    });
  });

  it('creates a new blackout window availability rule in Asia/Manila for the current user then store in UTC', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Blackout period',
        rule_type: 'blackout_window',
        date_start: DateTime.fromISO('2026-08-10T10:00:00', { zone: 'Asia/Manila' }).toISO(),
        date_end: DateTime.fromISO('2026-08-10T12:00:00', { zone: 'Asia/Manila' }).toISO(),
        is_active: true,
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      description: 'Blackout period',
      rule_type: 'blackout_window',
      date_start: DateTime.fromISO('2026-08-10T10:00:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
      date_end: DateTime.fromISO('2026-08-10T12:00:00', { zone: 'Asia/Manila' }).toUTC().toISO(),
      is_active: true,
    });
  });

  it('creates a new blackout window availability in UTC and store in UTC', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Blackout period',
        rule_type: 'blackout_window',
        date_start: DateTime.fromISO('2026-08-10T10:00:00Z').toISO(),
        date_end: DateTime.fromISO('2026-08-10T12:00:00Z').toISO(),
        is_active: true,
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      description: 'Blackout period',
      rule_type: 'blackout_window',
      date_start: DateTime.fromISO('2026-08-10T10:00:00Z').toUTC().toISO(),
      date_end: DateTime.fromISO('2026-08-10T12:00:00Z').toUTC().toISO(),
      is_active: true,
    });
  });

  it('updates an existing availability rule for the current user', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Weekly availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        time_zone: 'Asia/Manila',
        is_active: true,
      })
      .expect(201);

    const ruleId = createResponse.body.data.id;

    await request(context.app.getHttpServer())
      .patch(`/availability-rules/${ruleId}`)
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Updated weekly availability',
        start_time: '10:00:00',
        end_time: '18:00:00',
      })
      .expect(200);

    const getResponse = await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(getResponse.body.data).toHaveLength(1);
    expect(getResponse.body.data[0]).toMatchObject({
      description: 'Updated weekly availability',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '10:00:00',
      end_time: '18:00:00',
      time_zone: 'Asia/Manila',
      is_active: true,
    });
  });

  it('forbids customer from managing availability rules', async () => {
    const customer = await createAuthenticatedUser(context.app, {
      email: 'customer@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${customer.access_token}`)
      .expect(403);
  });

  it('rejects unauthenticated requests to manage availability rules', async () => {
    await request(context.app.getHttpServer()).get('/availability-rules/me').expect(401);
  });

  it('rejects unauthenticated requests to create availability rules', async () => {
    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .send({
        description: 'Weekly availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
      .expect(401);
  });

  it('rejects unauthenticated requests to update availability rules', async () => {
    await request(context.app.getHttpServer())
      .patch('/availability-rules/some-rule-id')
      .send({
        description: 'Updated weekly availability',
        start_time: '10:00:00',
        end_time: '18:00:00',
      })
      .expect(401);
  });

  it('returns 404 when trying to update a non-existent availability rule', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .patch('/availability-rules/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Updated weekly availability',
        start_time: '10:00:00',
        end_time: '18:00:00',
      })
      .expect(404);
  });

  it('returns 400 when creating a weekly window rule with missing fields', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        rule_type: 'weekly_window',
        // Missing day_of_week, start_time, end_time
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain(
      'Weekly window rules require day_of_week, start_time, end_time, and time_zone',
    );
  });

  it('returns 400 when creating a blackout window rule with missing fields', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        rule_type: 'blackout_window',
        // Missing date_start, date_end
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain(
      'Blackout window rules require date_start and date_end',
    );
  });

  it('returns 400 when creating a rule with an invalid rule_type', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        rule_type: 'invalid_rule_type',
        description: 'Invalid rule type',
        is_active: true,
      })
      .expect(400);
  });

  it('returns 400 when updating a rule with an invalid rule_type', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Weekly availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
      .expect(201);

    const ruleId = createResponse.body.data.id;

    await request(context.app.getHttpServer())
      .patch(`/availability-rules/${ruleId}`)
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        rule_type: 'invalid_rule_type',
      })
      .expect(400);
  });

  it("forbids a user from updating another user's availability rule", async () => {
    const staff1 = await createAuthenticatedUser(context.app, {
      email: 'staff1@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const staff2 = await createAuthenticatedUser(context.app, {
      email: 'staff2@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff1.access_token}`)
      .send({
        description: 'Staff 1 availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
      .expect(201);

    const ruleId = createResponse.body.data.id;

    await request(context.app.getHttpServer())
      .patch(`/availability-rules/${ruleId}`)
      .set('Authorization', `Bearer ${staff2.access_token}`)
      .send({
        description: 'Attempted update by staff 2',
      })
      .expect(404);
  });

  it('allows a PLATFORM_ADMIN to update any user availability rule', async () => {
    const staff = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const admin = await createAuthenticatedUser(context.app, {
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'PLATFORM_ADMIN',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/availability-rules')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .send({
        description: 'Staff availability',
        rule_type: 'weekly_window',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      })
      .expect(201);

    const ruleId = createResponse.body.data.id;

    await request(context.app.getHttpServer())
      .patch(`/availability-rules/${ruleId}`)
      .set('Authorization', `Bearer ${admin.access_token}`)
      .send({
        description: 'Updated by admin',
      })
      .expect(200);

    const getResponse = await request(context.app.getHttpServer())
      .get('/availability-rules/me')
      .set('Authorization', `Bearer ${staff.access_token}`)
      .expect(200);

    expect(getResponse.body.data).toHaveLength(1);
    expect(getResponse.body.data[0]).toMatchObject({
      description: 'Updated by admin',
      rule_type: 'weekly_window',
      day_of_week: 1,
      start_time: '09:00:00',
      end_time: '17:00:00',
      is_active: true,
    });
  });
});

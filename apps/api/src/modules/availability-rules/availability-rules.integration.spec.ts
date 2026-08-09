import request from 'supertest';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';

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
      is_active: true,
    });
  });

  it('creates a new blackout window availability rule for the current user', async () => {
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
        date_start: '2024-01-01',
        date_end: '2024-01-07',
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
      date_start: expect.stringMatching(/2024-01-01/),
      date_end: expect.stringMatching(/2024-01-07/),
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
      'Weekly window rules require day_of_week, start_time, and end_time',
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
});

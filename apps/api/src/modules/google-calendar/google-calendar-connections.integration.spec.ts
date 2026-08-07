import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';

import { resetTestDb } from '../../test-utils/reset-test-db';

describe('Google calendar connection integration', () => {
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

  it('allows staff to create a pending google calendar connection', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'staff@example.com',
        provider_subject: 'provider-subject-123',
      })
      .expect(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        google_email: 'staff@example.com',
        provider_subject: 'provider-subject-123',
        status: 'pending',
      }),
    );
  });

  it('returns current user connection', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'user@example.com',
        provider_subject: 'provider-subject-456',
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .get('/google-calendar/connections/me')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .expect(200);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        google_email: 'user@example.com',
        provider_subject: 'provider-subject-456',
        status: 'pending',
      }),
    );
  });

  it('rejects duplicate connection creation for the same user', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'user@example.com',
        provider_subject: 'provider-subject-789',
      })
      .expect(201);

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'user@example.com',
        provider_subject: 'provider-subject-789',
      })
      .expect(409);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        statusCode: 409,
      }),
    );
  });

  it('updates the calendar selection and activates the connection', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'user@example.com',
        provider_subject: 'provider-subject-101112',
      })
      .expect(201);

    const connectionId = createResponse.body.data.id;

    const updateResponse = await request(context.app.getHttpServer())
      .patch(`/google-calendar/connections/${connectionId}/calendar-selection`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        calendar_id: 'calendar-id-123',
        calendar_summary: 'My Calendar',
      })
      .expect(200);

    expect(updateResponse.body.data).toEqual(
      expect.objectContaining({
        calendar_id: 'calendar-id-123',
        calendar_summary: 'My Calendar',
        status: 'active',
      }),
    );
  });

  it('revokes the connection', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'user@example.com',
        provider_subject: 'provider-subject-131415',
      })
      .expect(201);

    const connectionId = createResponse.body.data.id;

    const revokeResponse = await request(context.app.getHttpServer())
      .post(`/google-calendar/connections/${connectionId}/revoke`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .expect(201);

    expect(revokeResponse.body.data).toEqual(
      expect.objectContaining({
        status: 'revoked',
      }),
    );
  });

  it('rejects unauthenticated users from accessing google calendar connection endpoints', async () => {
    const response = await request(context.app.getHttpServer())
      .get('/google-calendar/connections/me')
      .expect(401);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        statusCode: 401,
      }),
    );
  });

  it('rejects patient users from creating a google calendar connection', async () => {
    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123!',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .send({
        google_email: 'patient@example.com',
        provider_subject: 'provider-subject-161718',
      })
      .expect(403);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        message: 'Insufficient permissions',
        statusCode: 403,
      }),
    );
  });

  it('rejects patient users from accessing google calendar connection endpoints', async () => {
    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123!',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .get('/google-calendar/connections/me')
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .expect(403);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        message: 'Insufficient permissions',
        statusCode: 403,
      }),
    );
  });

  it('rejects patient users from revoking a google calendar connection', async () => {
    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123!',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/connections/some-connection-id/revoke')
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .expect(403);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        message: 'Insufficient permissions',
        statusCode: 403,
      }),
    );
  });

  it('rejects invalid create connection payloads', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'invalid-email',
        provider_subject: '',
      })
      .expect(400);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });

  it('rejects invalid calendar selection payloads', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123!',
      role: 'PSYCHOLOGIST',
    });

    const createResponse = await request(context.app.getHttpServer())
      .post('/google-calendar/connections')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        google_email: 'staff@example.com',
        provider_subject: 'provider-subject-192021',
      })
      .expect(201);

    const connectionId = createResponse.body.data.id;

    const response = await request(context.app.getHttpServer())
      .patch(`/google-calendar/connections/${connectionId}/calendar-selection`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        calendar_id: '',
        calendar_summary: '',
      })
      .expect(400);

    expect(response.body.error).toEqual(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });
});

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';
import { resetTestDb } from '../../test-utils/reset-test-db';
import {
  createAuthenticatedUser,
  registerTestUser,
  type TestUserRegistration,
} from '../../test-utils/auth-test-helpers';

describe('Auth Integration', () => {
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

  it('registers a new user and returns token pair', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123',
        role: 'PATIENT',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data.access_token).toBeTypeOf('string');
    expect(response.body.data).toHaveProperty('refresh_token');
    expect(response.body.data.refresh_token).toBeTypeOf('string');
    expect(response.body.data).toHaveProperty('token_type', 'Bearer');
    expect(response.body.data).toHaveProperty('expires_in');
    expect(response.body.data.expires_in).toBeTypeOf('number');
  });

  it('rejects registration if email already exists', async () => {
    await registerTestUser(context.app, {
      email: 'existing@example.com',
      password: 'Password123',
      role: 'PLATFORM_ADMIN',
    });

    const response = await request(context.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'Password123',
        role: 'PLATFORM_ADMIN',
      })
      .expect(409);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Email already exists');
  });

  it('rejects registration if email is not valid and has weak password', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'invalid-email',
        password: 'short',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error.message).toContain('email must be an email');
    expect(response.body.error.message).toContain(
      'password must be longer than or equal to 8 characters',
    );
    expect(response.body.error.message).toContain(
      'Password must contain at least one uppercase letter',
    );
  });

  it('rejects registration with invalid role', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Password123',
        role: 'INVALID_ROLE',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error.message).toContain(
      'role must be one of the following values: PLATFORM_ADMIN, PSYCHOLOGIST, ASSISTANT, PATIENT, GUEST',
    );
  });

  it('rejects registration with missing required fields', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: '',
        password: '',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
  });

  it('logs in an existing user and returns token pair', async () => {
    // First, register a user
    await registerTestUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    // Then, log in with the same credentials
    const response = await request(context.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data.access_token).toBeTypeOf('string');
    expect(response.body.data).toHaveProperty('refresh_token');
    expect(response.body.data.refresh_token).toBeTypeOf('string');
  });

  it('rejects login with invalid credentials', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'WrongPassword',
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Invalid credentials');
  });

  it('rejects login with wrong password for existing user', async () => {
    // First, register a user
    await registerTestUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    // Then, attempt to log in with the wrong password
    const response = await request(context.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'WrongPassword',
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Invalid credentials');
  });

  it('returns current user from /me endpoint with valid access token', async () => {
    const userPayload: TestUserRegistration = {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PATIENT',
    };

    const user = await registerTestUser(context.app, userPayload);

    const accessToken = user.access_token;

    const response = await request(context.app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveProperty('email', userPayload.email);
    expect(response.body.data).toHaveProperty('role', userPayload.role);
  });

  it('rejects /me endpoint with invalid access token', async () => {
    const response = await request(context.app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Unauthorized');
  });

  it('refreshes tokens with valid refresh token', async () => {
    const userPayload: TestUserRegistration = {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PATIENT',
    };

    const user = await registerTestUser(context.app, userPayload);

    const refreshToken = user.refresh_token;

    const response = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(201);

    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data.access_token).toBeTypeOf('string');
    expect(response.body.data).toHaveProperty('refresh_token');
    expect(response.body.data.refresh_token).toBeTypeOf('string');
  });

  it('rejects token refresh with invalid refresh token', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Unauthorized');
  });

  it('rejects token refresh when using access token instead of refresh token', async () => {
    const userPayload: TestUserRegistration = {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PATIENT',
    };

    const user = await registerTestUser(context.app, userPayload);

    const accessToken = user.access_token;

    const response = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Unauthorized');
  });

  it('invalidates refresh token after rotation', async () => {
    const userPayload: TestUserRegistration = {
      email: 'user@example.com',
      password: 'Password123',
      role: 'ASSISTANT',
    };

    const user = await registerTestUser(context.app, userPayload);

    const refreshToken = user.refresh_token;

    // First refresh
    const firstRefreshResponse = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(201);

    const newRefreshToken = firstRefreshResponse.body.data.refresh_token;

    expect(refreshToken).not.toEqual(newRefreshToken);

    // Attempt to refresh again with the old refresh token
    const secondRefreshResponse = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(401);

    expect(secondRefreshResponse.body).toHaveProperty('error');
    expect(secondRefreshResponse.body.error).toHaveProperty('message', 'Invalid refresh token');

    // The new refresh token should work
    const thirdRefreshResponse = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${newRefreshToken}`)
      .expect(201);

    expect(thirdRefreshResponse.body.data).toHaveProperty('access_token');
    expect(thirdRefreshResponse.body.data.access_token).toBeTypeOf('string');
  });

  it('logs out user and invalidates refresh token', async () => {
    const userPayload: TestUserRegistration = {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PATIENT',
    };

    const user = await registerTestUser(context.app, userPayload);

    const accessToken = user.access_token;

    // Logout the user
    await request(context.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    // Attempt to refresh tokens with the old refresh token
    const refreshResponse = await request(context.app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${user.refresh_token}`)
      .expect(401);

    expect(refreshResponse.body).toHaveProperty('error');
    expect(refreshResponse.body.error).toHaveProperty('message', 'Invalid refresh token');
  });

  it('rejects logout without access token', async () => {
    await request(context.app.getHttpServer()).post('/auth/logout').expect(401);
  });

  it('rejects logout with invalid token', async () => {
    await request(context.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalid-access-token')
      .expect(401);
  });

  it('allows access to staff area for authorized roles', async () => {
    const userPayload: TestUserRegistration = {
      email: 'user@example.com',
      password: 'Password123',
      role: 'ASSISTANT',
    };

    const user = await createAuthenticatedUser(context.app, userPayload);

    const accessToken = user.access_token;

    const response = await request(context.app.getHttpServer())
      .get('/auth/staff-area')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveProperty('message', 'Staff access granted');
    expect(response.body.data.user).toHaveProperty('email', userPayload.email);
    expect(response.body.data.user).toHaveProperty('role', userPayload.role);
  });

  it('allows access to admin area for PLATFORM_ADMIN role', async () => {
    const userPayload: TestUserRegistration = {
      email: 'admin@example.com',
      password: 'Password123',
      role: 'PLATFORM_ADMIN',
    };

    const user = await createAuthenticatedUser(context.app, userPayload);

    const accessToken = user.access_token;

    const response = await request(context.app.getHttpServer())
      .get('/auth/admin-area')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toHaveProperty('message', 'Admin access granted');
    expect(response.body.data.user).toHaveProperty('email', userPayload.email);
    expect(response.body.data.user).toHaveProperty('role', userPayload.role);
  });

  it('rejects staff area access without access token', async () => {
    await request(context.app.getHttpServer()).get('/auth/staff-area').expect(401);
  });

  it('rejects admin area access without access token', async () => {
    await request(context.app.getHttpServer()).get('/auth/admin-area').expect(401);
  });

  it('rejects admin area access for non-admin users', async () => {
    const userPayload: TestUserRegistration = {
      email: 'staff@example.com',
      password: 'Password123',
      role: 'ASSISTANT',
    };

    const user = await createAuthenticatedUser(context.app, userPayload);

    const accessToken = user.access_token;

    const response = await request(context.app.getHttpServer())
      .get('/auth/admin-area')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Insufficient permissions');
  });
});

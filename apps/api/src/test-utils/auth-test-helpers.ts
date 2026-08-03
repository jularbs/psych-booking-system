import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: string;
}

export interface TestUserRegistration {
  email: string;
  password: string;
  role?: 'PLATFORM_ADMIN' | 'PSYCHOLOGIST' | 'ASSISTANT' | 'PATIENT' | 'GUEST';
}

export async function registerTestUser(
  app: INestApplication,
  user: TestUserRegistration,
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(user)
    .expect(201);

  return response.body.data;
}

export async function loginTestUser(
  app: INestApplication,
  payload: { email: string; password: string },
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(payload)
    .expect(201);

  return response.body.data;
}

export async function createAuthenticatedUser(
  app: INestApplication,
  payload: TestUserRegistration,
): Promise<{
  access_token: string;
  refresh_token: string;
  email: string;
  password: string;
  role: string;
}> {
  const tokens = await registerTestUser(app, payload);

  return {
    ...tokens,
    email: payload.email,
    password: payload.password,
    role: payload.role ?? 'GUEST',
  };
}

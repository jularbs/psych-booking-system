import request from 'supertest';
import { TestAppContext } from './create-test-app';
import { ServicesTable } from '../database/database.types';
import { Insertable, Selectable } from 'kysely';

export interface CreateServicePayload {
  slug?: string;
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  price_amount?: string;
  currency?: string;
  is_active?: boolean;
}

export async function createServiceHelper(
  context: TestAppContext,
  payload: CreateServicePayload = {},
): Promise<Selectable<ServicesTable>> {
  const suffix = Date.now().toString(36);
  const values: Insertable<ServicesTable> = {
    slug: payload.slug ?? `service-${suffix}`,
    name: payload.name ?? 'Integration Test Service',
    description: payload.description ?? 'Service generated for integration tests',
    duration_minutes: payload.duration_minutes ?? 60,
    price_amount: payload.price_amount ?? '2500.00',
    currency: payload.currency ?? 'PHP',
    is_active: payload.is_active ?? true,
  };

  return context.db.insertInto('services').values(values).returningAll().executeTakeFirstOrThrow();
}

export async function createServiceWithToken(
  context: TestAppContext,
  token: string,
  payload: CreateServicePayload = {},
) {
  const response = await request(context.app.getHttpServer())
    .post('/services')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);

  return response.body.data as Selectable<ServicesTable>;
}

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, TestAppContext } from '../../test-utils/create-test-app';
import { createAuthenticatedUser } from '../../test-utils/auth-test-helpers';
import { createServiceWithToken } from '../../test-utils/services-test-helpers';
import { resetTestDb } from '../../test-utils/reset-test-db';

describe('Services Integration Tests', () => {
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

  it('allows staff to create a new service', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        slug: 'new-service',
        name: 'New Service',
        description: 'A new service',
        duration_minutes: 60,
        price_amount: '100.00',
        currency: 'PHP',
        is_active: true,
      })
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.slug).toBe('new-service');
    expect(response.body.data.name).toBe('New Service');
  });

  it('rejects service creation if required fields are missing', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        slug: 'new-service',
        // Missing name, duration_minutes, price_amount, currency, is_active
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('rejects service creation if slug already exists', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    // Create a service with the same slug first
    await createServiceWithToken(context, staffUser.access_token, {
      slug: 'duplicate-service',
      name: 'Duplicate Service',
      description: 'This service has a duplicate slug',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        slug: 'duplicate-service',
        name: 'Another Service',
        description: 'Trying to create another service with the same slug',
        duration_minutes: 60,
        price_amount: '100.00',
        currency: 'PHP',
        is_active: true,
      })
      .expect(409);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('Service slug already exists');
  });

  it('rejects invalid create service payloads', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        slug: 'ab', // too short
        name: 'A', // too short
        description: 'A'.repeat(2001), // too long
        duration_minutes: 5, // too short
        price_amount: 'invalid-price', // invalid format
        currency: 'US', // too short
        is_active: true,
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain(
      'slug must be longer than or equal to 3 characters',
    );
    expect(response.body.error.message).toContain(
      'name must be longer than or equal to 3 characters',
    );
    expect(response.body.error.message).toContain(
      'description must be shorter than or equal to 2000 characters',
    );
    expect(response.body.error.message).toContain('duration_minutes must not be less than 10');
    expect(response.body.error.message).toContain(
      'priceAmount must be a valid decimal string with two decimal places',
    );
    expect(response.body.error.message).toContain(
      'currency must be a valid ISO 4217 currency code',
    );
  });

  it('rejects service creation if not authenticated', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/services')
      .send({
        slug: 'new-service',
        name: 'New Service',
        description: 'A new service',
        duration_minutes: 60,
        price_amount: '100.00',
        currency: 'PHP',
        is_active: true,
      })
      .expect(401);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('rejects service creation if authenticated user is not authorized', async () => {
    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .send({
        slug: 'new-service',
        name: 'New Service',
        description: 'A new service',
        duration_minutes: 60,
        price_amount: '100.00',
        currency: 'PHP',
        is_active: true,
      })
      .expect(403);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Insufficient permissions');
  });

  it('returns only active services in public list', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'staff@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    // Create an active service
    await createServiceWithToken(context, staffUser.access_token, {
      slug: 'active-service',
      name: 'Active Service',
      description: 'This service is active',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    await createServiceWithToken(context, staffUser.access_token, {
      slug: 'inactive-service',
      name: 'Inactive Service',
      description: 'This service is inactive',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: false,
    });

    const response = await request(context.app.getHttpServer()).get('/services').expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].slug).toBe('active-service');
  });

  it('allows staff to list all services including inactive ones', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    await createServiceWithToken(context, staffUser.access_token, {
      slug: 'active-service',
      name: 'Active Service',
      description: 'This service is active',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    await createServiceWithToken(context, staffUser.access_token, {
      slug: 'inactive-service',
      name: 'Inactive Service',
      description: 'This service is inactive',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: false,
    });

    const response = await request(context.app.getHttpServer())
      .get('/services/manage')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
  });

  it('forbids service management routes for non authenticated users', async () => {
    const response = await request(context.app.getHttpServer()).get('/services/manage').expect(401);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('forbids service management routes for non authorized users', async () => {
    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .get('/services/manage')
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .expect(403);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Insufficient permissions');
  });

  it('gets a service by ID for authorized users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });
    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-get',
      name: 'Service to Get',
      description: 'This service will be retrieved by ID',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .get(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(createdService.id);
    expect(response.body.data.slug).toBe('service-to-get');
  });

  it('returns 404 when getting a service by ID that does not exist', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const response = await request(context.app.getHttpServer())
      .get('/services/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .expect(404);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Service not found');
  });

  it('updates a service for authorized users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });
    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-update',
      name: 'Service to Update',
      description: 'This service will be updated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        name: 'Updated Service Name',
        description: 'Updated description',
      })
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.name).toBe('Updated Service Name');
    expect(response.body.data.description).toBe('Updated description');
  });

  it('rejects service updates for unauthenticated users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-update',
      name: 'Service to Update',
      description: 'This service will be updated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/services/${createdService.id}`)
      .send({
        name: 'Updated Service Name',
        description: 'Updated description',
      })
      .expect(401);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('rejects service updates for unauthorized users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-update',
      name: 'Service to Update',
      description: 'This service will be updated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .send({
        name: 'Updated Service Name',
        description: 'Updated description',
      })
      .expect(403);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Insufficient permissions');
  });

  it('rejects service updates with invalid payloads', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-update',
      name: 'Service to Update',
      description: 'This service will be updated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/services/${createdService.id}`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        name: 'A', // too short
        description: 'A'.repeat(2001), // too long
        duration_minutes: 5, // too short
        price_amount: 'invalid-price', // invalid format
        currency: 'US', // too short
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain(
      'name must be longer than or equal to 3 characters',
    );
    expect(response.body.error.message).toContain(
      'description must be shorter than or equal to 2000 characters',
    );
    expect(response.body.error.message).toContain('duration_minutes must not be less than 10');
    expect(response.body.error.message).toContain(
      'priceAmount must be a valid decimal string with two decimal places',
    );
    expect(response.body.error.message).toContain(
      'currency must be a valid ISO 4217 currency code',
    );
  });

  it('rejects service updates if slug already belongs to another service', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    // Create a service with a specific slug
    await createServiceWithToken(context, staffUser.access_token, {
      slug: 'existing-slug',
      name: 'Existing Service',
      description: 'This service has an existing slug',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    // Create another service that we will attempt to update
    const serviceToUpdate = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-update',
      name: 'Service to Update',
      description: 'This service will be updated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .patch(`/services/${serviceToUpdate.id}`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .send({
        slug: 'existing-slug', // Attempting to change to an existing slug
      })
      .expect(409);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toContain('Service slug already exists');
  });

  it('deactivates a service for authorized users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-deactivate',
      name: 'Service to Deactivate',
      description: 'This service will be deactivated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .post(`/services/${createdService.id}/deactivate`)
      .set('Authorization', `Bearer ${staffUser.access_token}`)
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.is_active).toBe(false);
  });

  it('rejects service deactivation for unauthenticated users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-deactivate-unauthenticated',
      name: 'Service to Deactivate Unauthenticated',
      description: 'This service will be deactivated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const response = await request(context.app.getHttpServer())
      .post(`/services/${createdService.id}/deactivate`)
      .expect(401);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('rejects service deactivation for unauthorized users', async () => {
    const staffUser = await createAuthenticatedUser(context.app, {
      email: 'user@example.com',
      password: 'Password123',
      role: 'PSYCHOLOGIST',
    });

    const createdService = await createServiceWithToken(context, staffUser.access_token, {
      slug: 'service-to-deactivate-unauthorized',
      name: 'Service to Deactivate Unauthorized',
      description: 'This service will be deactivated',
      duration_minutes: 60,
      price_amount: '100.00',
      currency: 'PHP',
      is_active: true,
    });

    const patientUser = await createAuthenticatedUser(context.app, {
      email: 'patient@example.com',
      password: 'Password123',
      role: 'PATIENT',
    });

    const response = await request(context.app.getHttpServer())
      .post(`/services/${createdService.id}/deactivate`)
      .set('Authorization', `Bearer ${patientUser.access_token}`)
      .expect(403);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Insufficient permissions');
  });
});

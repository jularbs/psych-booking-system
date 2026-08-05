import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServicesApiService, type ServiceRecord } from '../../data-access/services-api.service';
import { ServicesManagePageStore } from './services-manage-page.store';

describe('ServicesManagePageStore', () => {
  let store: ServicesManagePageStore;
  const mockServices: ServiceRecord[] = [
    {
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
      created_at: '2026-07-24T00:00:00.000Z',
      updated_at: '2026-07-24T00:00:00.000Z',
    },
    {
      id: 'svc-2',
      slug: 'follow-up',
      name: 'Follow-up',
      description: null,
      duration_minutes: 45,
      price_amount: '1800.00',
      currency: 'PHP',
      is_active: false,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    },
  ];

  const servicesApiService = {
    listManage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ServicesManagePageStore,
        { provide: ServicesApiService, useValue: servicesApiService },
      ],
    });

    store = TestBed.inject(ServicesManagePageStore);
  });

  it('loads services successfully', async () => {
    servicesApiService.listManage.mockReturnValue(of(mockServices));

    await store.load();

    expect(store.services()).toEqual(mockServices);
    expect(store.filteredServices()).toEqual(mockServices);
    expect(store.isLoading()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('creates a new service and adds it to the list', async () => {
    const createdService: ServiceRecord = {
      id: 'svc-3',
      slug: 'new-service',
      name: 'New Service',
      description: 'New Service Description',
      duration_minutes: 30,
      price_amount: '1000.00',
      currency: 'PHP',
      is_active: true,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    };

    store.setServicesForTest(mockServices);
    servicesApiService.create.mockReturnValue(of(createdService));

    await store.create({
      slug: 'new-service',
      name: 'New Service',
      description: 'New Service Description',
      duration_minutes: 30,
      price_amount: '1000.00',
      currency: 'PHP',
      is_active: true,
    });

    expect(store.services()).toContainEqual(createdService);
    expect(store.isSubmitting()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('updates an existing service and replaces it in the list', async () => {
    const updatedService: ServiceRecord = {
      ...mockServices[0],
      name: 'Updated Consultation',
    };

    store.setServicesForTest(mockServices);
    servicesApiService.update.mockReturnValue(of(updatedService));

    await store.update(updatedService.id, { name: 'Updated Consultation' });
    expect(store.services()).toContainEqual(updatedService);
    expect(store.isSubmitting()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('deactivates a service and updates its status', async () => {
    const deactivatedService: ServiceRecord = {
      ...mockServices[0],
      is_active: false,
    };
    store.setServicesForTest(mockServices);
    servicesApiService.deactivate.mockReturnValue(of(deactivatedService));

    await store.deactivate(deactivatedService.id);
    expect(store.services()).toContainEqual(deactivatedService);
    expect(store.isSubmitting()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('reactivates a service and updates its status', async () => {
    const reactivatedService: ServiceRecord = {
      ...mockServices[1],
      is_active: true,
    };
    store.setServicesForTest(mockServices);
    servicesApiService.update.mockReturnValue(of(reactivatedService));

    await store.reactivate(reactivatedService.id);
    expect(store.services()).toContainEqual(reactivatedService);
    expect(store.isSubmitting()).toBe(false);
    expect(store.errorMessage()).toBeNull();
  });

  it('selects and clears the editing service', () => {
    store.startEditing(mockServices[0]);
    expect(store.editingService()).toEqual(mockServices[0]);

    store.stopEditing();
    expect(store.editingService()).toBeNull();
  });

  it('sets error state when loading services fails', async () => {
    servicesApiService.listManage.mockReturnValue(throwError(() => new Error('API error')));

    await store.load();

    expect(store.services()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.errorMessage()).toBe('Failed to load services.');
  });

  it('filters active services correctly', async () => {
    store.setServicesForTest(mockServices);

    store.setFilter('active');

    expect(store.filteredServices().every((s) => s.is_active)).toBe(true);
  });

  it('filters inactive services correctly', async () => {
    store.setServicesForTest(mockServices);

    store.setFilter('inactive');

    expect(store.filteredServices().every((s) => !s.is_active)).toBe(true);
  });
});

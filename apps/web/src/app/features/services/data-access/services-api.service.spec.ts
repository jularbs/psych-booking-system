import { TestBed } from '@angular/core/testing';

import { ServicesApiService } from './services-api.service';
import { ApiClientService } from '../../../core/api/api-client.service';
import { firstValueFrom, of } from 'rxjs';

describe('ServicesApiService', () => {
  let service: ServicesApiService;

  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [ServicesApiService, { provide: ApiClientService, useValue: apiClient }],
    });
    service = TestBed.inject(ServicesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('gets public services list', async () => {
    apiClient.get.mockReturnValue(
      of([{ id: 'svc-1', slug: 'initial-consult', name: 'Initial Consult' }]),
    );

    const result = await firstValueFrom(service.listPublic());

    expect(apiClient.get).toHaveBeenCalledWith('/services');
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-1',
          slug: 'initial-consult',
          name: 'Initial Consult',
        }),
      ]),
    );
  });

  it('gets managemenet services list', async () => {
    apiClient.get.mockReturnValue(
      of([{ id: 'svc-1', slug: 'initial-consult', name: 'Initial Consult' }]),
    );

    const result = await firstValueFrom(service.listManage());
    expect(apiClient.get).toHaveBeenCalledWith('/services/manage');
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-1',
          slug: 'initial-consult',
          name: 'Initial Consult',
        }),
      ]),
    );
  });

  it('creates a new service', async () => {
    const payload = {
      slug: 'new-service',
      name: 'New Service',
      description: 'New Service Description',
      duration_minutes: 60,
      price_amount: '1000.00',
      currency: 'PHP',
      is_active: false,
    };

    apiClient.post.mockReturnValue(of({ id: 'svc-2', ...payload }));

    const result = await firstValueFrom(service.create(payload));

    expect(apiClient.post).toHaveBeenCalledWith('/services', payload);
    expect(result).toEqual(expect.objectContaining({ id: 'svc-2', ...payload }));
  });

  it('updates an existing service', async () => {
    const payload = {
      slug: 'updated-service',
      name: 'Updated Service',
      description: 'Updated Service Description',
      duration_minutes: 90,
      price_amount: '1500.00',
      currency: 'PHP',
    };

    apiClient.patch.mockReturnValue(of({ id: 'svc-1', ...payload }));

    const result = await firstValueFrom(service.update('svc-1', payload));
    expect(apiClient.patch).toHaveBeenCalledWith('/services/svc-1', payload);
    expect(result).toEqual(expect.objectContaining({ id: 'svc-1', ...payload }));
  });

  it('deactivates a service', async () => {
    apiClient.post.mockReturnValue(of({ id: 'svc-1', is_active: false }));

    const result = await firstValueFrom(service.deactivate('svc-1'));
    expect(apiClient.post).toHaveBeenCalledWith('/services/svc-1/deactivate', {
      is_active: false,
    });
    expect(result).toEqual(expect.objectContaining({ id: 'svc-1', is_active: false }));
  });
});

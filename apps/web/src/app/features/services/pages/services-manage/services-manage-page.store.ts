import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ServicesApiService,
  type CreateServicePayload,
  type ServiceRecord,
  type UpdateServicePayload,
} from '../../data-access/services-api.service';

export type ServicesFilter = 'all' | 'active' | 'inactive';

@Injectable()
export class ServicesManagePageStore {
  private readonly servicesApiService = inject(ServicesApiService);
  private readonly allServices = signal<ServiceRecord[]>([]);
  private readonly currentFilter = signal<ServicesFilter>('all');
  private readonly currentEditingService = signal<ServiceRecord | null>(null);
  private readonly loading = signal(true);
  private readonly submitting = signal(false);
  private readonly currentErrorMessage = signal<string | null>(null);

  readonly services = this.allServices.asReadonly();
  readonly filter = this.currentFilter.asReadonly();
  readonly editingService = this.currentEditingService.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isSubmitting = this.submitting.asReadonly();
  readonly errorMessage = this.currentErrorMessage.asReadonly();

  readonly filteredServices = computed(() => {
    const filter = this.currentFilter();
    const services = this.allServices();

    if (filter === 'active') {
      return services.filter((service) => service.is_active);
    }

    if (filter === 'inactive') {
      return services.filter((service) => !service.is_active);
    }

    return services;
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.currentErrorMessage.set(null);

    try {
      const services = await firstValueFrom(this.servicesApiService.listManage());
      this.allServices.set(services);
    } catch {
      this.allServices.set([]);
      this.currentErrorMessage.set('Failed to load services.');
    } finally {
      this.loading.set(false);
    }
  }

  async create(payload: CreateServicePayload): Promise<void> {
    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const created = await firstValueFrom(this.servicesApiService.create(payload));
      this.allServices.update((services) => [created, ...services]);
    } catch {
      this.currentErrorMessage.set('Failed to create service.');
    } finally {
      this.submitting.set(false);
    }
  }

  async update(id: string, payload: UpdateServicePayload): Promise<void> {
    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const updated = await firstValueFrom(this.servicesApiService.update(id, payload));
      this.replaceService(updated);
      this.currentEditingService.set(null);
    } catch {
      this.currentErrorMessage.set('Failed to update service.');
    } finally {
      this.submitting.set(false);
    }
  }

  async deactivate(id: string): Promise<void> {
    this.submitting.set(true);
    this.currentErrorMessage.set(null);

    try {
      const updated = await firstValueFrom(this.servicesApiService.deactivate(id));
      this.replaceService(updated);
    } catch {
      this.currentErrorMessage.set('Failed to deactivate service.');
    } finally {
      this.submitting.set(false);
    }
  }

  async reactivate(id: string): Promise<void> {
    await this.update(id, {
      is_active: true,
    });
  }

  setFilter(filter: ServicesFilter): void {
    this.currentFilter.set(filter);
  }

  startEditing(service: ServiceRecord): void {
    this.currentEditingService.set(service);
  }

  stopEditing(): void {
    this.currentEditingService.set(null);
  }

  setServicesForTest(services: ServiceRecord[]): void {
    this.allServices.set(services);
  }

  private replaceService(updated: ServiceRecord): void {
    this.allServices.update((services) =>
      services.map((service) => (service.id === updated.id ? updated : service)),
    );
  }
}

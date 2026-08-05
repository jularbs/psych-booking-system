import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { ServiceFormComponent } from '../../components/service-form/service-form.component';
import {
  CreateServicePayload,
  ServiceRecord,
  UpdateServicePayload,
} from '../../data-access/services-api.service';
import { ServicesFilter, ServicesManagePageStore } from './services-manage-page.store';

@Component({
  selector: 'app-services-manage',
  standalone: true,
  imports: [CommonModule, ServiceFormComponent],
  templateUrl: './services-manage.component.html',
})
export class ServicesManageComponent implements OnInit {
  private readonly store = inject(ServicesManagePageStore);

  readonly services = this.store.filteredServices;
  readonly isLoading = this.store.isLoading;
  readonly errorMessage = this.store.errorMessage;
  readonly filter = this.store.filter;
  readonly editingService = this.store.editingService;
  readonly isSubmitting = this.store.isSubmitting;

  readonly isEditing = computed(() => !!this.editingService());

  ngOnInit(): void {
    void this.store.load();
  }

  async handleSave(payload: CreateServicePayload): Promise<void> {
    const editingService = this.editingService();

    if (editingService) {
      await this.store.update(editingService.id, payload as UpdateServicePayload);
      return;
    }
    await this.store.create(payload);
  }

  async deactivate(id: string): Promise<void> {
    await this.store.deactivate(id);
  }

  async reactivate(id: string): Promise<void> {
    await this.store.reactivate(id);
  }

  edit(service: ServiceRecord): void {
    this.store.startEditing(service);
  }

  cancelEditing(): void {
    this.store.stopEditing();
  }

  changeFilter(filter: ServicesFilter): void {
    this.store.setFilter(filter);
  }
}

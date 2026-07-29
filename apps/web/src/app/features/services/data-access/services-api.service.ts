import { inject, Injectable } from '@angular/core';
import { ApiClientService } from '../../../core/api/api-client.service';
import { Observable } from 'rxjs/internal/Observable';

export interface ServiceRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_amount: string;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServicePayload {
  slug: string;
  name: string;
  description: string | null;
  price_amount: string;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
}

export interface UpdateServicePayload {
  slug?: string;
  name?: string;
  description?: string;
  duration_minutes?: number;
  price_amount?: string;
  currency?: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ServicesApiService {
  private readonly apiClient = inject(ApiClientService);

  listPublic(): Observable<ServiceRecord[]> {
    return this.apiClient.get<ServiceRecord[]>('/services');
  }

  listManage(): Observable<ServiceRecord[]> {
    return this.apiClient.get<ServiceRecord[]>('/services/manage');
  }

  create(payload: CreateServicePayload): Observable<ServiceRecord> {
    return this.apiClient.post<ServiceRecord>('/services', payload);
  }

  update(id: string, payload: UpdateServicePayload): Observable<ServiceRecord> {
    return this.apiClient.patch<ServiceRecord>(`/services/${id}`, payload);
  }

  deactivate(id: string): Observable<ServiceRecord> {
    return this.apiClient.post<ServiceRecord>(`/services/${id}/deactivate`, { is_active: false });
  }
}

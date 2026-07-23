import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { Observable } from 'rxjs/internal/Observable';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiClient = inject(ApiClientService);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.apiClient.post<LoginResponse>('/auth/login', payload);
  }
}

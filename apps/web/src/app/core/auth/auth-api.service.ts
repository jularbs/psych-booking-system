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
  tokenType: 'Bearer';
  expiresIn: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiClient = inject(ApiClientService);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.apiClient.post<LoginResponse>('/auth/login', payload);
  }

  logout(): Observable<{ success: boolean }> {
    return this.apiClient.post<{ success: boolean }>('/auth/logout', {});
  }

  refresh(refreshToken: string): Observable<LoginResponse> {
    return this.apiClient.post<LoginResponse>(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );
  }

  me(): Observable<{ id: string; email: string; role: string }> {
    return this.apiClient.get<{ id: string; email: string; role: string }>('/auth/me');
  }
}

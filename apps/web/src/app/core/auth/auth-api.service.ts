import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { map, Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiClient = inject(ApiClientService);

  private mapTokens(dto: LoginResponseDto): LoginResponse {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      tokenType: dto.token_type,
      expiresIn: dto.expires_in,
    };
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.apiClient
      .post<LoginResponseDto>('/auth/login', payload)
      .pipe(map((dto) => this.mapTokens(dto)));
  }

  logout(): Observable<{ success: boolean }> {
    return this.apiClient.post<{ success: boolean }>('/auth/logout', {});
  }

  refresh(refreshToken: string): Observable<LoginResponse> {
    return this.apiClient
      .post<LoginResponseDto>(
        '/auth/refresh',
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        },
      )
      .pipe(map((dto) => this.mapTokens(dto)));
  }

  me(): Observable<{ id: string; email: string; role: string }> {
    return this.apiClient.get<{ id: string; email: string; role: string }>('/auth/me');
  }
}

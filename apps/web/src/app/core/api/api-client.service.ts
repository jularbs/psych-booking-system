import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';
import { map, Observable } from 'rxjs';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiBaseUrl: string = inject(API_BASE_URL);

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(`${this.apiBaseUrl}${path}`, {
        headers: this.buildHeaders(options),
      })
      .pipe(map((response) => response.data));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(`${this.apiBaseUrl}${path}`, body, {
        headers: this.buildHeaders(options),
      })
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(`${this.apiBaseUrl}${path}`, body, {
        headers: this.buildHeaders(options),
      })
      .pipe(map((response) => response.data));
  }

  private buildHeaders(options?: ApiRequestOptions): HttpHeaders | undefined {
    if (!options?.headers) return undefined;
    return new HttpHeaders(options.headers);
  }
}

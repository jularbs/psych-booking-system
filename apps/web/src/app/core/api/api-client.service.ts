import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';
import { Observable } from 'rxjs';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiBaseUrl: string = inject(API_BASE_URL);

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(`${this.apiBaseUrl}${path}`, {
      headers: this.buildHeaders(options),
    });
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(`${this.apiBaseUrl}${path}`, body, {
      headers: this.buildHeaders(options),
    });
  }

  private buildHeaders(options?: ApiRequestOptions): HttpHeaders | undefined {
    if (!options?.headers) return undefined;
    return new HttpHeaders(options.headers);
  }
}

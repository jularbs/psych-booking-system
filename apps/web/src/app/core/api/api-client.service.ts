import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiBaseUrl: string = inject(API_BASE_URL);

  get<T>(path: string) {
    return this.http.get<T>(`${this.apiBaseUrl}${path}`);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiBaseUrl}${path}`, body);
  }
}

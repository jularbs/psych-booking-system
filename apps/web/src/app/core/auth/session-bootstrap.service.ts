import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionBootstrapService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);

  bootstrap(): Observable<void> {
    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      return this.authApiService.me().pipe(
        map(() => undefined),
        catchError(() => {
          this.authService.clearSession();
          return of(undefined);
        }),
      );
    }

    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) {
      return of(undefined);
    }

    return this.authApiService.refresh(refreshToken).pipe(
      tap((tokens) => {
        this.authService.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
      }),
      map(() => undefined),
      catchError(() => {
        this.authService.clearSession();
        return of(undefined);
      }),
    );
  }
}

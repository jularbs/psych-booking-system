import { inject, Injectable } from '@angular/core';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  Observable,
} from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root',
})
export class SessionRefreshService {
  private inFlightRefresh$?: Observable<string | null>;

  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly authStateService = inject(AuthStateService);

  async refreshSession(): Promise<string | null> {
    const refreshToken = this.authService.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.authStateService.isRefreshing();

    if (!this.inFlightRefresh$) {
      this.inFlightRefresh$ = this.authApiService.refresh(refreshToken).pipe(
        tap((tokens) => {
          this.authService.setSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        }),
        switchMap((tokens) =>
          this.authApiService.me().pipe(
            tap((user) => {
              this.authStateService.setAuthenticated(user);
            }),
            map(() => tokens.accessToken),
          ),
        ),
        catchError(() => {
          this.authService.clearSession();
          this.authStateService.clear();
          return of(null);
        }),
        finalize(() => {
          this.inFlightRefresh$ = undefined;
        }),
        shareReplay(1),
      );
    }
    return firstValueFrom(this.inFlightRefresh$);
  }
}

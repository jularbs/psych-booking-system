import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { SessionRefreshService } from './session-refresh.service';

@Injectable({
  providedIn: 'root',
})
export class SessionBootstrapService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly authStateService = inject(AuthStateService);
  private readonly sessionRefreshService = inject(SessionRefreshService);

  async bootstrap(): Promise<void> {
    const accessToken = this.authService.getAccessToken();

    if (accessToken) {
      try {
        const user = await firstValueFrom(this.authApiService.me());
        this.authStateService.setAuthenticated(user);
        return;
      } catch {
        this.authService.clearSession();
        this.authStateService.clear();
        return;
      }
    }

    const refreshToken = this.authService.getRefreshToken();

    if (!refreshToken) {
      return;
    }

    await this.sessionRefreshService.refreshSession();
  }
}

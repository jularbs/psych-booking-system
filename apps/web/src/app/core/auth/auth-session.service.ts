import { inject, Injectable } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authApiService.logout());
    } catch {
      // Ignore errors during logout, as we want to clear the session regardless of the API response
    }

    this.authService.clearSession();
    this.authStateService.clear();
    await this.router.navigate(['/auth/login']);
  }

  async forceLogout(): Promise<void> {
    this.authService.clearSession();
    this.authStateService.clear();
    await this.router.navigate(['/auth/login']);
  }
}

import { inject, Injectable } from '@angular/core';

import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root',
})
export class AuthUiService {
  private readonly authStateService = inject(AuthStateService);

  canViewAdminUi(): boolean {
    return this.authStateService.user()?.role === 'PLATFORM_ADMIN';
  }

  canViewStaffUi(): boolean {
    const role = this.authStateService.user()?.role;
    return role === 'PLATFORM_ADMIN' || role === 'PSYCHOLOGIST' || role === 'ASSISTANT';
  }
}

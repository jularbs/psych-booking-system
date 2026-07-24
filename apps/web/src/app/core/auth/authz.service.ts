import { inject, Injectable } from '@angular/core';

import { AuthStateService } from './auth-state.service';

export type AppRole = 'PLATFORM_ADMIN' | 'PSYCHOLOGIST' | 'ASSISTANT' | 'CUSTOMER';

const STAFF_ROLES: AppRole[] = ['PLATFORM_ADMIN', 'PSYCHOLOGIST', 'ASSISTANT'];

@Injectable({
  providedIn: 'root',
})
export class AuthzService {
  private readonly authStateService = inject(AuthStateService);

  hasRole(role: AppRole): boolean {
    const user = this.authStateService.user();
    return user?.role === role;
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const user = this.authStateService.user();
    return !!user && roles.includes(user.role as AppRole);
  }

  isStaff(): boolean {
    return this.hasAnyRole(STAFF_ROLES);
  }
}

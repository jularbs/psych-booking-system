import { Injectable, computed, signal } from '@angular/core';

export type AuthStatus = 'authenticated' | 'refreshing' | 'anonymous';
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly currentStatus = signal<AuthStatus>('anonymous');

  readonly user = this.currentUser.asReadonly();
  readonly status = this.currentStatus.asReadonly();
  readonly isAuthenticated = computed(() => this.currentStatus() !== 'anonymous');

  setAuthenticated(user: AuthUser): void {
    this.currentUser.set(user);
    this.currentStatus.set('authenticated');
  }

  isRefreshing(): void {
    if (this.currentUser() !== null) {
      this.currentStatus.set('refreshing');
    }
  }

  clear(): void {
    this.currentUser.set(null);
    this.currentStatus.set('anonymous');
  }
}

import { beforeEach, describe, expect, it } from 'vitest';

import { AuthStateService } from './auth-state.service';
import { AuthUiService } from './auth-ui.service';
import { TestBed } from '@angular/core/testing';

describe('AuthUiService', () => {
  let authStateService: AuthStateService;
  let service: AuthUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthUiService, AuthStateService],
    });

    authStateService = TestBed.inject(AuthStateService);
    service = TestBed.inject(AuthUiService);
    authStateService.clear();
  });

  it('shows admin UI only to platform admin', () => {
    authStateService.setAuthenticated({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
    });

    expect(service.canViewAdminUi()).toBe(true);
    expect(service.canViewStaffUi()).toBe(true);
  });

  it('shows staff UI to staff roles', () => {
    authStateService.setAuthenticated({
      id: 'user-2',
      email: 'assistant@example.com',
      role: 'ASSISTANT',
    });

    expect(service.canViewAdminUi()).toBe(false);
    expect(service.canViewStaffUi()).toBe(true);
  });

  it('hides staff and admin UI from customers', () => {
    authStateService.setAuthenticated({
      id: 'user-3',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });

    expect(service.canViewAdminUi()).toBe(false);
    expect(service.canViewStaffUi()).toBe(false);
  });
});

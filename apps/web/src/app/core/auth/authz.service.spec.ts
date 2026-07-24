import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { AuthStateService } from './auth-state.service';
import { AuthzService } from './authz.service';

describe('AuthzService', () => {
  let authStateService: AuthStateService;
  let service: AuthzService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthStateService, AuthzService],
    });

    authStateService = TestBed.inject(AuthStateService);
    service = TestBed.inject(AuthzService);
    authStateService.clear();
  });

  it('returns false when no user is authenticated', () => {
    expect(service.hasRole('PLATFORM_ADMIN')).toBe(false);
    expect(service.hasAnyRole(['PLATFORM_ADMIN', 'ASSISTANT'])).toBe(false);
    expect(service.isStaff()).toBe(false);
  });

  it('returns true when user has exact role', () => {
    authStateService.setAuthenticated({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
    });

    expect(service.hasRole('PLATFORM_ADMIN')).toBe(true);
    expect(service.hasRole('CUSTOMER')).toBe(false);
  });

  it('returns true when user has one of the allowed roles', () => {
    authStateService.setAuthenticated({
      id: 'user-1',
      email: 'assistant@example.com',
      role: 'ASSISTANT',
    });

    expect(service.hasAnyRole(['PLATFORM_ADMIN', 'ASSISTANT'])).toBe(true);
    expect(service.hasAnyRole(['PLATFORM_ADMIN', 'PSYCHOLOGIST'])).toBe(false);
  });

  it('identifies staff roles correctly', () => {
    authStateService.setAuthenticated({
      id: 'user-1',
      email: 'psych@example.com',
      role: 'PSYCHOLOGIST',
    });

    expect(service.isStaff()).toBe(true);
  });

  it('does not treat customer as staff', () => {
    authStateService.setAuthenticated({
      id: 'user-1',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });

    expect(service.isStaff()).toBe(false);
  });
});

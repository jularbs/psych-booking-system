import { TestBed } from '@angular/core/testing';

import { AuthStateService, type AuthUser } from './auth-state.service';

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBe(null);
    expect(service.status()).toBe('anonymous');
  });

  it('sets authenticated state with user', () => {
    const user: AuthUser = {
      id: '1',
      email: 'user@example.com',
      role: 'GUEST',
    };

    service.setAuthenticated(user);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(user);
    expect(service.status()).toBe('authenticated');
  });

  it('sets refreshing status without changing user', () => {
    const user: AuthUser = {
      id: '1',
      email: 'user@example.com',
      role: 'GUEST',
    };

    service.setAuthenticated(user);
    service.isRefreshing();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(user);
    expect(service.status()).toBe('refreshing');
  });

  it('clears auth state', () => {
    service.setAuthenticated({
      id: '1',
      email: 'user@example.com',
      role: 'GUEST',
    });

    service.clear();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBe(null);
    expect(service.status()).toBe('anonymous');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    localStorage.clear();
  });

  it('stores and reads access token', () => {
    service.setSession({ access_token: 'test-token', refresh_token: 'test-refresh-token' });
    expect(service.getAccessToken()).toBe('test-token');
    expect(service.getRefreshToken()).toBe('test-refresh-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears session', () => {
    service.setSession({ access_token: 'test-token', refresh_token: 'test-refresh-token' });
    service.clearSession();
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});

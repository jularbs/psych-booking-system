import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    localStorage.clear();
  });

  it('stores and reads access token', () => {
    service.setAccessToken('test-token');
    expect(service.getAccessToken()).toBe('test-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears session', () => {
    service.setAccessToken('test-token');
    service.clearSession();
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});

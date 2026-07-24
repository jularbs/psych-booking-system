import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionRefreshService } from './session-refresh.service';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { of, Subject, throwError } from 'rxjs';

describe('SessionRefreshService', () => {
  let service: SessionRefreshService;

  const authApiServiceMock = {
    refresh: vi.fn(),
    me: vi.fn(),
  };

  const authServiceMock = {
    getRefreshToken: vi.fn(),
    setSession: vi.fn(),
    clearSession: vi.fn(),
  };

  const authStateServiceMock = {
    setAuthenticated: vi.fn(),
    isRefreshing: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        SessionRefreshService,
        { provide: AuthApiService, useValue: authApiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: AuthStateService, useValue: authStateServiceMock },
      ],
    });
    service = TestBed.inject(SessionRefreshService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns null if no refresh token is available', async () => {
    authServiceMock.getRefreshToken.mockReturnValue(null);

    const result = await service.refreshSession();

    expect(result).toBeNull();
    expect(authApiServiceMock.refresh).not.toHaveBeenCalled();
  });

  it('refreshes the session and loads current user', async () => {
    authServiceMock.getRefreshToken.mockReturnValue('refresh-token');
    authApiServiceMock.refresh.mockReturnValue(
      of({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      }),
    );
    authApiServiceMock.me.mockReturnValue(
      of({
        id: '1',
        email: 'user@example.com',
        role: 'GUEST',
      }),
    );

    const result = await service.refreshSession();

    expect(authStateServiceMock.isRefreshing).toHaveBeenCalled();
    expect(authServiceMock.setSession).toHaveBeenCalledWith({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(authStateServiceMock.setAuthenticated).toHaveBeenCalledWith({
      id: '1',
      email: 'user@example.com',
      role: 'GUEST',
    });
    expect(result).toBe('new-access-token');
  });

  it('clears session and auth state on refresh failure', async () => {
    authServiceMock.getRefreshToken.mockReturnValue('refresh-token');
    authApiServiceMock.refresh.mockReturnValue(throwError(() => new Error('Refresh failed')));
    await expect(service.refreshSession()).resolves.toBeNull();
    expect(authServiceMock.clearSession).toHaveBeenCalled();
    expect(authStateServiceMock.clear).toHaveBeenCalled();
  });

  it('reuses the same inflight refresh request for concurrent calls', async () => {
    const refreshSubject = new Subject<{
      accessToken: string;
      refreshToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
    }>();

    authServiceMock.getRefreshToken.mockReturnValue('refresh-token');
    authApiServiceMock.refresh.mockReturnValue(refreshSubject.asObservable());
    authApiServiceMock.me.mockReturnValue(
      of({
        id: '1',
        email: 'user@example.com',
        role: 'GUEST',
      }),
    );

    const promise1 = service.refreshSession();
    const promise2 = service.refreshSession();

    refreshSubject.next({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    });
    refreshSubject.complete();

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe('new-access-token');
    expect(result2).toBe('new-access-token');
    expect(authApiServiceMock.refresh).toHaveBeenCalledTimes(1);
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { SessionBootstrapService } from './session-bootstrap.service';
import { SessionRefreshService } from './session-refresh.service';

describe('SessionBootstrapService', () => {
  let service: SessionBootstrapService;

  const authApiService = {
    me: vi.fn(),
  };

  const authService = {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearSession: vi.fn(),
  };

  const authStateService = {
    setAuthenticated: vi.fn(),
    clear: vi.fn(),
  };

  const sessionRefreshService = {
    refreshSession: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        SessionBootstrapService,
        { provide: AuthApiService, useValue: authApiService },
        { provide: AuthService, useValue: authService },
        { provide: AuthStateService, useValue: authStateService },
        { provide: SessionRefreshService, useValue: sessionRefreshService },
      ],
    });

    service = TestBed.inject(SessionBootstrapService);
  });

  it('loads current user when access token exists', async () => {
    authService.getAccessToken.mockReturnValue('access-token');
    authApiService.me.mockReturnValue(
      of({
        id: 'user-1',
        email: 'user@example.com',
        role: 'CUSTOMER',
      }),
    );

    await expect(service.bootstrap()).resolves.toBeUndefined();

    expect(authStateService.setAuthenticated).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });
  });

  it('refreshes session when only refresh token exists', async () => {
    authService.getAccessToken.mockReturnValue(null);
    authService.getRefreshToken.mockReturnValue('refresh-token');
    sessionRefreshService.refreshSession.mockResolvedValue('new-access-token');

    await expect(service.bootstrap()).resolves.toBeUndefined();

    expect(sessionRefreshService.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('clears session and state when access-token identity load fails', async () => {
    authService.getAccessToken.mockReturnValue('access-token');
    authApiService.me.mockReturnValue(throwError(() => new Error('me failed')));

    await expect(service.bootstrap()).resolves.toBeUndefined();

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(authStateService.clear).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no tokens exist', async () => {
    authService.getAccessToken.mockReturnValue(null);
    authService.getRefreshToken.mockReturnValue(null);

    await expect(service.bootstrap()).resolves.toBeUndefined();

    expect(authApiService.me).not.toHaveBeenCalled();
    expect(sessionRefreshService.refreshSession).not.toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';

import { AuthSessionService } from './auth-session.service';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
describe('AuthSessionService', () => {
  let service: AuthSessionService;

  const authApiService = {
    logout: vi.fn(),
  };

  const authService = {
    clearSession: vi.fn(),
  };

  const authStateService = {
    clear: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AuthApiService, useValue: authApiService },
        { provide: AuthService, useValue: authService },
        { provide: AuthStateService, useValue: authStateService },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('logs out through API then clears session and navigates to login', async () => {
    authApiService.logout.mockReturnValue(of({ success: true }));
    router.navigate.mockResolvedValue(true);

    await service.logout();

    expect(authApiService.logout).toHaveBeenCalledTimes(1);
    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(authStateService.clear).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('still clears session and navigates to login even if API logout fails', async () => {
    authApiService.logout.mockImplementation(() => {
      throw new Error('API logout failed');
    });
    router.navigate.mockResolvedValue(true);

    await service.logout();

    expect(authApiService.logout).toHaveBeenCalledTimes(1);
    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(authStateService.clear).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});

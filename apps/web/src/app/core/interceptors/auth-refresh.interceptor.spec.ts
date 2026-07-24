import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authRefreshInterceptor } from './auth-refresh.interceptor';
import { of } from 'rxjs';
import { SessionRefreshService } from '../auth/session-refresh.service';
import { AuthService } from '../auth/auth.service';
describe('authRefreshInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authRefreshInterceptor(req, next));

  const sessionRefreshService = {
    refreshSession: vi.fn(),
  };

  const authService = {
    getAccessToken: vi.fn(),
    clearSession: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionRefreshService, useValue: sessionRefreshService },
        { provide: AuthService, useValue: authService },
      ],
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('passes through successful responses without refresh', async () => {
    const request = new HttpRequest('GET', '/api/v1/protected');
    const next = vi.fn().mockReturnValue(of('ok'));

    const result = await TestBed.runInInjectionContext(async () => {
      return await new Promise<unknown>((resolve, reject) => {
        authRefreshInterceptor(request, next).subscribe({
          next: resolve,
          error: reject,
        });
      });
    });

    expect(result).toBe('ok');
    expect(sessionRefreshService.refreshSession).not.toHaveBeenCalled();
  });

  it('refreshes and retries once on  401 response for protected routes', async () => {
    const request = new HttpRequest('GET', '/api/v1/protected');
    const unauthorizedResponse = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/v1/protected',
    });
    const next = vi
      .fn()
      .mockReturnValueOnce(throwError(() => unauthorizedResponse))
      .mockReturnValueOnce(of('retried-ok'));

    sessionRefreshService.refreshSession.mockResolvedValue('new-access-token');

    const result = await TestBed.runInInjectionContext(async () => {
      return await new Promise<unknown>((resolve, reject) => {
        authRefreshInterceptor(request, next).subscribe({
          next: resolve,
          error: reject,
        });
      });
    });

    expect(sessionRefreshService.refreshSession).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);

    const retriedRequest = next.mock.calls[1][0] as HttpRequest<unknown>;
    expect(retriedRequest.headers.get('Authorization')).toBe('Bearer new-access-token');
    expect(result).toBe('retried-ok');
  });

  it('does not try to refresh on auth routes', async () => {
    const request = new HttpRequest('POST', '/api/v1/auth/login', {});
    const unauthorizedResponse = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/v1/auth/login',
    });
    const next = vi.fn().mockReturnValue(throwError(() => unauthorizedResponse));

    await expect(
      TestBed.runInInjectionContext(async () => {
        return await new Promise<unknown>((resolve, reject) => {
          authRefreshInterceptor(request, next).subscribe({
            next: resolve,
            error: reject,
          });
        });
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(sessionRefreshService.refreshSession).not.toHaveBeenCalled();
  });

  it('propagates the original 401 response if refresh fails', async () => {
    const request = new HttpRequest('GET', '/api/v1/protected');
    const unauthorizedResponse = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/v1/protected',
    });
    const next = vi.fn().mockReturnValue(throwError(() => unauthorizedResponse));

    sessionRefreshService.refreshSession.mockResolvedValue(null);

    await expect(
      TestBed.runInInjectionContext(async () => {
        return await new Promise<unknown>((resolve, reject) => {
          authRefreshInterceptor(request, next).subscribe({
            next: resolve,
            error: reject,
          });
        });
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(sessionRefreshService.refreshSession).toHaveBeenCalledTimes(1);
  });
});

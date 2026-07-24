import { TestBed } from '@angular/core/testing';
import { Router, UrlSegment } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthzService } from '../auth/authz.service';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  const authzService = {
    hasAnyRole: vi.fn(),
  };

  const router = {
    createUrlTree: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthzService, useValue: authzService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows route when no roles are configured', () => {
    const route = {
      data: {},
    } as never;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, [] as UrlSegment[]));

    expect(result).toBe(true);
  });

  it('allows route when user has one of the required roles', () => {
    authzService.hasAnyRole.mockReturnValue(true);

    const route = {
      data: {
        roles: ['PLATFORM_ADMIN', 'ASSISTANT'],
      },
    } as never;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, [] as UrlSegment[]));

    expect(result).toBe(true);
  });

  it('redirects when user lacks required roles', () => {
    authzService.hasAnyRole.mockReturnValue(false);
    router.createUrlTree.mockReturnValue({ redirected: true });

    const route = {
      data: {
        roles: ['PLATFORM_ADMIN'],
      },
    } as never;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, [] as UrlSegment[]));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toEqual({ redirected: true });
  });
});

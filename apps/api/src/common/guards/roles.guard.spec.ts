import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
describe('RolesGuard', () => {
  let guard: RolesGuard;

  const reflector = {
    getAllAndOverride: vi.fn(),
  };

  const createExecutionContext = (user?: { role?: string }): ExecutionContext =>
    ({
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    vi.resetAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('should be defined', () => {
    expect(reflector as unknown as Reflector).toBeDefined();
  });

  it('allows when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = guard.canActivate(createExecutionContext());

    expect(result).toBe(true);
  });

  it('allows access when user role matches one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN', 'USER']);

    const result = guard.canActivate(createExecutionContext({ role: 'PLATFORM_ADMIN' }));

    expect(result).toBe(true);
  });

  it('throws forbidden when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN', 'USER']);
    expect(() => guard.canActivate(createExecutionContext())).toThrow(ForbiddenException);
  });

  it('throws forbidden when user role does not match required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN', 'USER']);
    expect(() => guard.canActivate(createExecutionContext({ role: 'GUEST' }))).toThrow(
      ForbiddenException,
    );
  });
});

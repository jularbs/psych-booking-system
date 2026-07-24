import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController(authService as never);
  });

  it('returns current user identity for me', async () => {
    authService.me.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });

    const result = await controller.me({
      user: { sub: 'user-1' },
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });
  });

  it('throws unauthorized when me has no user id', async () => {
    await expect(controller.me({ user: {} })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns staff area payload', async () => {
    const result = await controller.staffArea({
      sub: 'user-1',
      email: 'staff@example.com',
      role: 'ASSISTANT',
    });

    expect(result).toEqual({
      message: 'Staff access granted',
      user: {
        id: 'user-1',
        email: 'staff@example.com',
        role: 'ASSISTANT',
      },
    });
  });

  it('returns admin area payload', async () => {
    const result = await controller.adminArea({
      sub: 'admin-1',
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
    });

    expect(result).toEqual({
      message: 'Admin access granted',
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'PLATFORM_ADMIN',
      },
    });
  });

  it('throws unauthorized when me user lookup fails', async () => {
    authService.me.mockResolvedValue(undefined);

    await expect(
      controller.me({
        user: { sub: 'missing-user' },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

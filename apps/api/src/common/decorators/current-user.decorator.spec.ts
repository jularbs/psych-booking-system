import { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { currentUserFactory } from './current-user.decorator';

describe('currentUserFactory', () => {
  const createExecutionContext = (user: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as ExecutionContext;

  it('returns the whole user when no key is provided', () => {
    const user = { sub: 'user-1', email: 'user@example.com', role: 'CUSTOMER' };

    const result = currentUserFactory(undefined, createExecutionContext(user));

    expect(result).toEqual(user);
  });

  it('returns a specific user field when key is provided', () => {
    const user = { sub: 'user-1', email: 'user@example.com', role: 'CUSTOMER' };

    const result = currentUserFactory('sub', createExecutionContext(user));

    expect(result).toBe('user-1');
  });

  it('returns undefined when user is missing', () => {
    const result = currentUserFactory('sub', {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext);

    expect(result).toBeUndefined();
  });
});

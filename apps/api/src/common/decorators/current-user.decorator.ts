import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export function currentUserFactory(data: string | undefined, ctx: ExecutionContext): unknown {
  const request = ctx.switchToHttp().getRequest<{ user?: Record<string, unknown> }>();
  const user = request.user;

  if (!data) {
    return user;
  }

  return user?.[data];
}

export const CurrentUser = createParamDecorator(currentUserFactory);

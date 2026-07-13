import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { lastValueFrom, of } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

describe('ResponseEnvelopeInterceptor', () => {
  it('should be defined', () => {
    expect(new ResponseEnvelopeInterceptor()).toBeDefined();
  });

  it('wraps successful responses in an envelope', async () => {
    const interceptor = new ResponseEnvelopeInterceptor();

    const mockContext = {} as ExecutionContext;
    const mockNext: CallHandler = {
      handle: () => of({ ok: true }),
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, mockNext),
    );

    expect(result).toEqual({ success: true, data: { ok: true } });
  });
});

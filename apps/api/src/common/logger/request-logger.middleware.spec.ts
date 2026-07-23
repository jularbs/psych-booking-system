import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('should be defined', () => {
    expect(new RequestLoggerMiddleware({ log: vi.fn() } as never)).toBeDefined();
  });

  it('sets x-request-id on response and logs lifecycle', () => {
    const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn() };
    const middleware = new RequestLoggerMiddleware(logger as never);

    const req = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      header: vi.fn().mockReturnValue(undefined),
    } as never;

    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') cb();
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const next = vi.fn();

    middleware.use(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
    expect(next).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledTimes(2);
  });
});

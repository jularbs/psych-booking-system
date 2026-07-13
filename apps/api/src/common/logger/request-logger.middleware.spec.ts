import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('should be defined', () => {
    expect(
      new RequestLoggerMiddleware({ log: jest.fn() } as never),
    ).toBeDefined();
  });

  it('sets x-request-id on response and logs lifecycle', () => {
    const logger = { log: jest.fn() } as any;
    const middleware = new RequestLoggerMiddleware(logger);

    const req: any = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      header: jest.fn().mockReturnValue(undefined),
    };

    const res: any = {
      statusCode: 200,
      setHeader: jest.fn(),
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') cb();
      }),
    };

    const next = jest.fn();

    middleware.use(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      expect.any(String),
    );
    expect(next).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledTimes(2);
  });
});

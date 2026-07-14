import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { LoggerService } from './logger.service';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const incomingId = req.header('x-request-id');
    const requestId =
      incomingId && incomingId.trim().length > 0 ? incomingId : randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    this.logger.log('Incoming request', 'HTTP', {
      requestId,
      method: req.method,
      path: req.originalUrl,
    });

    res.on('finish', () => {
      this.logger.log('Request completed', 'HTTP', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  }
}

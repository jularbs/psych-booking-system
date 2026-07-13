import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

type LogContext = Record<string, unknown>;

@Injectable()
export class LoggerService implements NestLoggerService {
  log(message: string, context?: string, meta?: LogContext): void {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        context,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: LogContext,
  ): void {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        trace,
        context,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  warn(message: string, context?: string, meta?: LogContext): void {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        context,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  debug?(message: string, context?: string, meta?: LogContext): void {
    console.debug(
      JSON.stringify({
        level: 'debug',
        message,
        context,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  verbose?(message: string, context?: string, meta?: LogContext): void {
    console.info(
      JSON.stringify({
        level: 'verbose',
        message,
        context,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ method: string; url: string }>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = isHttpException ? exception.getResponse() : 'Internal server error';
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : typeof rawMessage === 'object' && rawMessage && 'message' in rawMessage
          ? (rawMessage as { message?: string | string[] }).message
          : 'Internal server error';

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

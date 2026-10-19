import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Ocorreu um erro interno no servidor';
    let details: any[] = [];

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.errorMessage || exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        if (anyRes.error && typeof anyRes.error === 'object') {
          code = anyRes.error.code || 'HTTP_ERROR';
          message = anyRes.error.message || exception.message;
          details = anyRes.error.details || [];
        } else {
          code = anyRes.error || exception.name || 'HTTP_ERROR';
          message = Array.isArray(anyRes.message)
            ? anyRes.message.join(', ')
            : anyRes.message || exception.message;
        }
      } else {
        message = String(res);
      }
    } else {
      this.logger.error('Unhandled exception caught:', exception);
    }

    response.status(status).json({
      error: {
        code,
        message,
        details,
      },
    });
  }
}

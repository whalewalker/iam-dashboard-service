import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface RequestWithUser extends Request {
  user?: {
    username?: string;
    id?: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    this.logger.log(
      `${method} ${url} - User: ${user?.username ?? 'Anonymous'} - Body: ${JSON.stringify(body)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.logger.log(`${method} ${url} - ${responseTime}ms`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error(
          `${method} ${url} - ${responseTime}ms - Error: ${error}`,
        );
        throw error;
      }),
    );
  }
}

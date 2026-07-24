import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { SessionRefreshService } from '../auth/session-refresh.service';
import { inject } from '@angular/core';

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')
  );
}
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionRefreshService = inject(SessionRefreshService);
  return next(req).pipe(
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status !== 401 || isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      return from(sessionRefreshService.refreshSession()).pipe(
        switchMap((accessToken) => {
          if (!accessToken) {
            return throwError(() => error);
          }
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          return next(retryReq);
        }),
        catchError(() => {
          return throwError(() => error);
        }),
      );
    }),
  );
};

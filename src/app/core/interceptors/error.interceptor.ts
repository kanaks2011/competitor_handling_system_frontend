import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (shouldSkipNotification(error, req.method, req.url)) {
        return throwError(() => error);
      }

      messageService.add({
        severity: error.status === 429 ? 'warn' : 'error',
        summary: error.status === 429 ? 'Rate limit' : 'Request failed',
        detail: extractErrorMessage(error),
        life: 5000,
      });

      return throwError(() => error);
    }),
  );
};

function shouldSkipNotification(error: HttpErrorResponse, method: string, url: string): boolean {
  if (error.status === 401 || error.status === 403) {
    return true;
  }
  if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
    return true;
  }
  if (method === 'GET' && error.status < 500 && error.status !== 429) {
    return true;
  }
  return false;
}

function extractErrorMessage(error: HttpErrorResponse): string {
  const body = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body.message === 'string') {
    return body.message;
  }
  return `Unexpected error (${error.status})`;
}

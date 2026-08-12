import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { ApiErrorBody } from '../models/api-response.model';

/** Surfaces API error messages as toasts. 401s are handled (refresh/redirect) by authInterceptor, so skip them here. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status !== 401) {
        const body = error.error as ApiErrorBody | undefined;
        const message = body?.message || error.statusText || 'Something went wrong. Please try again.';

        if (error.status === 0) {
          toast.error('Cannot reach the server. Check your connection and try again.');
        } else if (error.status >= 500) {
          toast.error('A server error occurred. Our team has been notified.');
        } else if (error.status !== 422) {
          // 422 (validation) is usually handled inline by the form, so don't double-toast it.
          toast.error(message);
        }
      }
      return throwError(() => error);
    })
  );
};

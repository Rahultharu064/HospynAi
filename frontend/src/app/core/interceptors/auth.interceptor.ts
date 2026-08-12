import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp', '/auth/resend-otp'];

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

function isPublicAuthPath(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const token = authService.getAccessToken();
  const authorizedReq =
    token && !isPublicAuthPath(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true })
      : req.clone({ withCredentials: true });

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isPublicAuthPath(req.url)
      ) {
        return authService.refreshToken().pipe(
          switchMap((data) => {
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${data.accessToken}` },
              withCredentials: true,
            });
            return next(retried);
          }),
          catchError((refreshError) => {
            authService.clearSession();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

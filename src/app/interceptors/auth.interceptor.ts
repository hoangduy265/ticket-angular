import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state.service';
import { Router } from '@angular/router';

// State để quản lý refresh token process
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Functional HTTP Interceptor cho authentication
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Bỏ qua interceptor nếu có header Skip-Interceptor
  if (req.headers.has('Skip-Interceptor')) {
    const modifiedReq = req.clone({
      headers: req.headers.delete('Skip-Interceptor'),
    });
    return next(modifiedReq);
  }

  // Skip thêm token cho các endpoint không cần auth
  const skipAuthUrls = ['/authen/login', '/authen/register', '/authen/forgot-password'];
  const shouldSkipAuth = skipAuthUrls.some((url) => req.url.includes(url));

  // Thêm token vào request nếu có và không phải skip auth
  const token = authService.getToken();
  if (token && !shouldSkipAuth) {
    req = addToken(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip xử lý 401 cho các endpoint không cần auth
      if (error.status === 401 && shouldSkipAuth) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        return handle401Error(req, next, authService, authStateService, router);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Thêm Authorization header vào request
 */
function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Xử lý lỗi 401 Unauthorized
 */
function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  authStateService: AuthStateService,
  router: Router
): Observable<HttpEvent<unknown>> {
  // Nếu đã logout rồi, không xử lý nữa
  if (authStateService.isLoggedOutFlag()) {
    return throwError(() => new Error('Session expired'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response.token;
        refreshTokenSubject.next(newToken);
        return next(addToken(request, newToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);

        // Chỉ logout một lần
        if (!authStateService.isLoggedOutFlag()) {
          authStateService.setLoggedOut(true);
          console.warn('Session expired, logging out...');
          authService.logout().subscribe({
            next: () => {
              console.log('Logged out successfully');
            },
            error: (logoutError) => {
              console.error('Logout error:', logoutError);
            },
          });
          router.navigate(['/login']);
        }

        return throwError(() => err);
      })
    );
  } else {
    // Đợi refresh token hoàn thành
    return refreshTokenSubject.pipe(
      filter((token) => token != null),
      take(1),
      switchMap((token) => {
        return next(addToken(request, token!));
      })
    );
  }
}

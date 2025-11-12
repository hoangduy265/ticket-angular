# Hướng dẫn Tính năng Đăng nhập - Đăng xuất - Đổi Mật khẩu

## Tổng quan Tính năng

Tính năng xác thực người dùng bao gồm đăng nhập, đăng xuất và quản lý phiên làm việc với JWT token. Hệ thống sử dụng API backend để xử lý xác thực và quản lý token.

## Cấu trúc API

Dựa trên tài liệu API `Authen-api-doc.md`, các endpoint chính:

### 1. Đăng nhập

- **Endpoint**: `POST /api/authen/login`
- **Body**: `{ username, password }`
- **Response**: Token, refresh token, thông tin user

### 2. Làm mới Token

- **Endpoint**: `POST /api/authen/refreshtoken`
- **Body**: `{ refreshToken }`
- **Response**: Token mới và refresh token mới

### 3. Đăng xuất

- **Endpoint**: `POST /api/authen/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ refreshToken }` (tùy chọn)

### 4. Thông tin User hiện tại

- **Endpoint**: `GET /api/authen/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Thông tin user

## Triển khai Service Xác thực

### AuthService Implementation

```typescript
// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  personalEmail?: string;
  workEmail?: string;
  address?: string;
  phone?: string;
  state: boolean;
  deptId?: number;
  departmentName?: string;
  companyId?: number;
  companyName?: string;
  note?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  token_type?: string;
  expires?: string;
  refresh_token?: string;
  refresh_token_expires?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/authen';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // Đăng nhập
  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.user && response.token) {
            this.setSession(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Làm mới token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refreshtoken`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setSession(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Đăng xuất
  logout(refreshToken?: string): Observable<any> {
    const token = refreshToken || this.getRefreshToken();
    return this.http.post(`${this.API_URL}/logout`, { refreshToken: token })
      .pipe(
        tap(() => this.clearSession()),
        catchError(this.handleError)
      );
  }

  // Lấy thông tin user hiện tại
  getCurrentUser(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(`${this.API_URL}/me`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Kiểm tra trạng thái đăng nhập
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const expiry = this.getTokenExpiry();
    return expiry ? new Date(expiry) > new Date() : false;
  }

  // Lấy token hiện tại
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Lấy refresh token
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Lấy thời gian hết hạn token
  private getTokenExpiry(): string | null {
    return localStorage.getItem('token_expiry');
  }

  // Lấy user hiện tại
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Private methods
  private setSession(authResult: AuthResponse): void {
    if (authResult.token && authResult.user) {
      localStorage.setItem('access_token', authResult.token);
      localStorage.setItem('refresh_token', authResult.refresh_token || '');
      localStorage.setItem('token_expiry', authResult.expires || '');
      this.currentUserSubject.next(authResult.user);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    this.currentUserSubject.next(null);
  }

  private loadUserFromStorage(): void {
    if (this.isLoggedIn()) {
      // Có thể load user info từ token hoặc gọi API
      // this.getCurrentUser().subscribe(user => this.currentUserSubject.next(user));
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('AuthService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

## Triển khai Component Đăng nhập

### LoginComponent Structure

```typescript
// src/app/pages/login/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;

      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastService.showSuccess('Đăng nhập thành công!');
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.showError(error.message || 'Đăng nhập thất bại!');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName === 'username' ? 'Tên đăng nhập' : 'Mật khẩu'} là bắt buộc`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${fieldName === 'username' ? 'Tên đăng nhập' : 'Mật khẩu'} phải có ít nhất ${minLength} ký tự`;
    }
    return '';
  }
}
```

### LoginComponent Template

```html
<!-- src/app/pages/login/login.component.html -->
<div class="login-page">
  <div class="login-box">
    <div class="login-logo">
      <a href="#"><b>Ticket</b>Management</a>
    </div>

    <div class="card">
      <div class="card-body login-card-body">
        <p class="login-box-msg">Đăng nhập để tiếp tục</p>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Username field -->
          <div class="input-group mb-3">
            <input
              type="text"
              class="form-control"
              placeholder="Tên đăng nhập"
              formControlName="username"
              [class.is-invalid]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
            <div class="input-group-append">
              <div class="input-group-text">
                <span class="fas fa-user"></span>
              </div>
            </div>
            <div class="invalid-feedback" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              {{ getErrorMessage('username') }}
            </div>
          </div>

          <!-- Password field -->
          <div class="input-group mb-3">
            <input
              [type]="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Mật khẩu"
              formControlName="password"
              [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
            <div class="input-group-append">
              <div class="input-group-text" (click)="togglePasswordVisibility()" style="cursor: pointer;">
                <span class="fas" [class.fa-eye]="!showPassword" [class.fa-eye-slash]="showPassword"></span>
              </div>
            </div>
            <div class="invalid-feedback" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              {{ getErrorMessage('password') }}
            </div>
          </div>

          <!-- Remember me -->
          <div class="row">
            <div class="col-8">
              <div class="icheck-primary">
                <input type="checkbox" id="remember">
                <label for="remember">
                  Ghi nhớ đăng nhập
                </label>
              </div>
            </div>
          </div>

          <!-- Submit button -->
          <div class="row mt-3">
            <div class="col-12">
              <button
                type="submit"
                class="btn btn-primary btn-block"
                [disabled]="isLoading">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm mr-2" role="status"></span>
                {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
```

## Triển khai Auth Interceptor

### AuthInterceptor Implementation

```typescript
// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Thêm token vào request nếu có
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpRequest<any>): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.token);
          return next.handle(this.addToken(request, token.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}
```

## Triển khai Auth Guard

### AuthGuard Implementation

```typescript
// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../components/toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      this.toastService.showWarning('Vui lòng đăng nhập để tiếp tục!');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
```

### LoginGuard Implementation

```typescript
// src/app/guards/login.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return false;
    }
    return true;
  }
}
```

## Cấu hình Routing

### App Routes Configuration

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [LoginGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
```

## Cấu hình HTTP Client và Interceptors

### App Config

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

## Triển khai Header Component với Logout

### Header Component

```typescript
// src/app/layout/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { ToastService } from '../../components/toast/toast.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.showSuccess('Đăng xuất thành công!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastService.showError('Có lỗi xảy ra khi đăng xuất!');
        console.error('Logout error:', error);
      }
    });
  }
}
```

## Xử lý Đổi Mật khẩu

*Lưu ý: API hiện tại chưa có endpoint đổi mật khẩu. Khi backend cung cấp API, có thể thêm tính năng này.*

### ChangePasswordComponent (Template)

```typescript
// src/app/components/change-password/change-password.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value
      ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      // TODO: Implement when API is available
      // const { currentPassword, newPassword } = this.changePasswordForm.value;
      // this.authService.changePassword({ currentPassword, newPassword }).subscribe(...)

      this.toastService.showInfo('Tính năng đổi mật khẩu đang được phát triển!');
      this.isLoading = false;
    }
  }
}
```

## Xử lý Lỗi và Validation

### Error Handling Best Practices

1. **Global Error Handling**: Implement global error interceptor
2. **User-Friendly Messages**: Convert API errors to user-friendly messages
3. **Loading States**: Show loading indicators during API calls
4. **Form Validation**: Client-side validation with server-side validation feedback

### Toast Service for Notifications

```typescript
// src/app/components/toast/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  public toast$ = this.toastSubject.asObservable();

  showSuccess(message: string, duration = 3000): void {
    this.toastSubject.next({ type: 'success', message, duration });
  }

  showError(message: string, duration = 5000): void {
    this.toastSubject.next({ type: 'error', message, duration });
  }

  showWarning(message: string, duration = 4000): void {
    this.toastSubject.next({ type: 'warning', message, duration });
  }

  showInfo(message: string, duration = 3000): void {
    this.toastSubject.next({ type: 'info', message, duration });
  }

  clear(): void {
    this.toastSubject.next(null);
  }
}
```

## Testing

### Unit Tests cho AuthService

```typescript
// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should login successfully', () => {
    const mockResponse = {
      success: true,
      message: 'Login successful',
      user: { id: 1, username: 'test' },
      token: 'mock-token'
    };

    service.login({ username: 'test', password: 'pass' }).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.user?.username).toBe('test');
    });

    const req = httpMock.expectOne('/api/authen/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

## Bảo mật và Best Practices

### Token Storage
- **Access Token**: Lưu trong memory (không localStorage để tránh XSS)
- **Refresh Token**: Lưu trong httpOnly cookie hoặc secure localStorage
- **Automatic Refresh**: Tự động refresh token khi hết hạn

### Security Headers
- **Content Security Policy (CSP)**
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **Strict-Transport-Security**

### Session Management
- **Single Session**: Chỉ cho phép một phiên đăng nhập active
- **Session Timeout**: Tự động logout sau thời gian không hoạt động
- **Concurrent Login Handling**: Xử lý đăng nhập từ nhiều thiết bị

### Input Validation
- **Client-side**: Form validation với Angular Reactive Forms
- **Server-side**: Luôn validate ở backend
- **Sanitization**: Sanitize user inputs

## Triển khai và Kiểm thử

### Development Steps

1. **Setup Services**: Implement AuthService với các API calls
2. **Create Components**: Login component với form validation
3. **Configure Guards**: AuthGuard và LoginGuard
4. **Setup Interceptors**: AuthInterceptor cho token management
5. **Update Routing**: Bảo vệ routes với guards
6. **Add UI Components**: Header với logout, Toast notifications
7. **Testing**: Unit tests và integration tests
8. **Error Handling**: Global error handling và user feedback

### Checklist Triển khai

- [ ] AuthService với tất cả API methods
- [ ] LoginComponent với form validation
- [ ] AuthGuard và LoginGuard
- [ ] AuthInterceptor với token refresh
- [ ] Routing configuration
- [ ] Header component với logout
- [ ] Toast notifications
- [ ] Error handling
- [ ] Unit tests
- [ ] Integration tests
- [ ] Security audit

### Troubleshooting

**Common Issues:**
- **401 Unauthorized**: Token hết hạn hoặc không hợp lệ
- **400 Bad Request**: Dữ liệu đầu vào không đúng format
- **CORS Issues**: Cấu hình CORS trên backend
- **Token Storage**: Xử lý secure storage cho tokens

**Debug Tips:**
- Kiểm tra Network tab trong DevTools
- Log API responses và errors
- Verify token format và expiry
- Test với different user scenarios

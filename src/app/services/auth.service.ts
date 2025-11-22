import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, interval } from 'rxjs';
import { catchError, map, tap, switchMap, filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthStateService } from './auth-state.service';

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
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl + '/authen';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Auto refresh configuration
  private readonly TOKEN_REFRESH_BUFFER = 20 * 60 * 1000; // Refresh 20 phút trước khi hết hạn
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Kiểm tra mỗi 5 phút
  private refreshTimerSubscription: any = null;

  constructor(private http: HttpClient, private authStateService: AuthStateService) {
    this.loadUserFromStorage();
    this.startAutoRefreshTimer();
  }

  // Đăng nhập
  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.user && response.token) {
          localStorage.setItem('Name', response.user.name || '');
          this.setSession(response);
          this.authStateService.resetLogoutFlag(); // Reset flag khi đăng nhập thành công
          this.startAutoRefreshTimer(); // Khởi động auto refresh sau khi login
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

    return this.http.post<AuthResponse>(`${this.API_URL}/refreshtoken`, { refreshToken }).pipe(
      tap((response) => {
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

    // Nếu không có refresh token, chỉ clear session local
    if (!token) {
      this.clearSession();
      return new Observable((observer) => {
        observer.next({ success: true, message: 'Logged out locally' });
        observer.complete();
      });
    }

    // Gọi API logout nhưng không để interceptor can thiệp
    return this.http
      .post(
        `${this.API_URL}/logout`,
        { refreshToken: token },
        {
          headers: {
            'Skip-Interceptor': 'true', // Flag để interceptor bỏ qua
          },
        }
      )
      .pipe(
        tap(() => this.clearSession()),
        catchError((error) => {
          // Nếu API logout thất bại, vẫn clear session local
          console.warn('Logout API failed, clearing session locally:', error);
          this.clearSession();
          return new Observable((observer) => {
            observer.next({ success: false, message: 'Logged out locally due to API error' });
            observer.complete();
          });
        })
      );
  }

  // Lấy thông tin user hiện tại
  getCurrentUser(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(`${this.API_URL}/me`).pipe(
      map((response) => response.data),
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
      localStorage.setItem('current_user', JSON.stringify(authResult.user));
      this.currentUserSubject.next(authResult.user);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.stopAutoRefreshTimer();
  }

  private loadUserFromStorage(): void {
    if (this.isLoggedIn()) {
      const userJson = localStorage.getItem('current_user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson) as User;
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          this.clearSession();
        }
      } else {
        // Chỉ gọi API nếu token còn hạn (tránh gọi API với token hết hạn)
        const expiry = this.getTokenExpiry();
        if (expiry && new Date(expiry) > new Date()) {
          this.getCurrentUser().subscribe({
            next: (user) => {
              localStorage.setItem('current_user', JSON.stringify(user));
              this.currentUserSubject.next(user);
            },
            error: (error) => {
              console.error('Error loading user:', error);
              this.clearSession();
            },
          });
        } else {
          // Token hết hạn, clear session
          console.warn('Token expired during load, clearing session');
          this.clearSession();
        }
      }
    }
  }

  /**
   * Bắt đầu timer tự động refresh token
   */
  private startAutoRefreshTimer(): void {
    // Dừng timer cũ nếu có
    this.stopAutoRefreshTimer();

    // Chỉ chạy timer nếu đã đăng nhập
    if (!this.isLoggedIn()) {
      return;
    }

    console.log('🔄 Auto refresh timer started');

    // Kiểm tra và refresh token định kỳ
    this.refreshTimerSubscription = interval(this.CHECK_INTERVAL)
      .pipe(
        filter(() => this.isLoggedIn()),
        switchMap(() => {
          const shouldRefresh = this.shouldRefreshToken();
          console.log('⏰ Token check:', { shouldRefresh, expiry: this.getTokenExpiry() });

          if (shouldRefresh) {
            console.log('🔄 Auto refreshing token...');
            return this.refreshToken();
          }
          return [];
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('✅ Token auto-refreshed successfully');
          }
        },
        error: (error) => {
          console.error('❌ Auto refresh token failed:', error);
          this.clearSession();
        },
      });
  }

  /**
   * Dừng timer tự động refresh token
   */
  private stopAutoRefreshTimer(): void {
    if (this.refreshTimerSubscription) {
      this.refreshTimerSubscription.unsubscribe();
      this.refreshTimerSubscription = null;
      console.log('⏹️ Auto refresh timer stopped');
    }
  }

  /**
   * Kiểm tra xem có nên refresh token không
   */
  private shouldRefreshToken(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;

    const expiryTime = new Date(expiry).getTime();
    const currentTime = new Date().getTime();
    const timeUntilExpiry = expiryTime - currentTime;

    // Refresh nếu token sắp hết hạn (trong vòng TOKEN_REFRESH_BUFFER)
    return timeUntilExpiry > 0 && timeUntilExpiry <= this.TOKEN_REFRESH_BUFFER;
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

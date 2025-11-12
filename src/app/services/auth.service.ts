import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // Đăng nhập
  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    debugger;
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
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
    return this.http.post(`${this.API_URL}/logout`, { refreshToken: token }).pipe(
      tap(() => this.clearSession()),
      catchError(this.handleError)
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

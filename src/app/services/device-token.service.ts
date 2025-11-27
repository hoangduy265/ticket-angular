import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces
export interface DeviceToken {
  id?: number;
  userId: number;
  deviceToken: string;
  platform: 'web' | 'android' | 'ios';
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface DeviceTokenResponse {
  success: boolean;
  data?: DeviceToken;
  message?: string;
}

export interface DeviceTokenListResponse {
  success: boolean;
  data?: DeviceToken[];
  message?: string;
}

export interface RegisterDeviceTokenRequest {
  userId: number;
  deviceToken: string;
  platform: 'web' | 'android' | 'ios';
}

export interface UpdateDeviceTokenRequest {
  userId?: number;
  platform?: 'web' | 'android' | 'ios';
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceTokenService {
  private readonly API_URL = `${environment.apiUrl}/DeviceTokens`;

  constructor(private http: HttpClient) {}

  /**
   * Đăng ký device token mới
   * @param request Thông tin device token
   * @returns Observable<DeviceToken>
   */
  registerDeviceToken(request: RegisterDeviceTokenRequest): Observable<DeviceToken> {
    return this.http.post<DeviceTokenResponse>(this.API_URL, request).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Đăng ký device token thất bại');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Lấy danh sách device tokens theo userId
   * @param userId ID của user
   * @returns Observable<DeviceToken[]>
   */
  getDeviceTokensByUser(userId: number): Observable<DeviceToken[]> {
    return this.http.get<DeviceTokenListResponse>(`${this.API_URL}/user/${userId}`).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cập nhật device token
   * @param id ID của device token
   * @param request Dữ liệu cập nhật
   * @returns Observable<DeviceToken>
   */
  updateDeviceToken(id: number, request: UpdateDeviceTokenRequest): Observable<DeviceToken> {
    return this.http.put<DeviceTokenResponse>(`${this.API_URL}/${id}`, request).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Cập nhật device token thất bại');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Vô hiệu hóa device token của thiết bị hiện tại
   * @param deviceToken Chuỗi token của thiết bị
   * @param platform Nền tảng thiết bị (web, android, ios)
   * @returns Observable<boolean>
   */
  deactiveteDeviceToken(deviceToken: string, platform?: string): Observable<boolean> {
    let url = `${this.API_URL}/deactivate?deviceToken=${encodeURIComponent(deviceToken)}`;
    if (platform) {
      url += `&platform=${encodeURIComponent(platform)}`;
    }
    return this.http.put<DeviceTokenResponse>(url, {}).pipe(
      map((response) => {
        return response.success === true;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Kiểm tra xem device token đã tồn tại chưa
   * @param userId ID của user
   * @param deviceToken Token cần kiểm tra
   * @returns Observable<DeviceToken | null>
   */
  findExistingToken(userId: number, deviceToken: string): Observable<DeviceToken | null> {
    return this.getDeviceTokensByUser(userId).pipe(
      map((tokens) => {
        const existingToken = tokens.find((t) => t.deviceToken === deviceToken && t.isActive);
        return existingToken || null;
      }),
      catchError(() => {
        return throwError(() => null);
      })
    );
  }

  /**
   * Đăng ký hoặc cập nhật device token
   * Tự động kiểm tra xem token đã tồn tại chưa
   * @param userId ID của user
   * @param deviceToken FCM token
   * @param platform Nền tảng (web, android, ios)
   * @returns Observable<DeviceToken>
   */
  registerOrUpdateToken(
    userId: number,
    deviceToken: string,
    platform: 'web' | 'android' | 'ios' = 'web'
  ): Observable<DeviceToken> {
    return new Observable((observer) => {
      this.findExistingToken(userId, deviceToken).subscribe({
        next: (existingToken) => {
          if (existingToken) {
            // Token đã tồn tại, cập nhật nếu cần
            if (!existingToken.isActive) {
              this.updateDeviceToken(existingToken.id!, { isActive: true }).subscribe({
                next: (updated) => {
                  observer.next(updated);
                  observer.complete();
                },
                error: (error) => observer.error(error),
              });
            } else {
              // Token đã tồn tại và đang active
              observer.next(existingToken);
              observer.complete();
            }
          } else {
            // Token chưa tồn tại, đăng ký mới
            this.registerDeviceToken({ userId, deviceToken, platform }).subscribe({
              next: (newToken) => {
                observer.next(newToken);
                observer.complete();
              },
              error: (error) => observer.error(error),
            });
          }
        },
        error: (error) => {
          // Lỗi khi kiểm tra, thử đăng ký mới
          this.registerDeviceToken({ userId, deviceToken, platform }).subscribe({
            next: (newToken) => {
              observer.next(newToken);
              observer.complete();
            },
            error: (error) => observer.error(error),
          });
        },
      });
    });
  }

  /**
   * Vô hiệu hóa tất cả device tokens của user theo PlatForm
   * @param userId ID của user
   * @returns Observable<boolean>
   */
  deactivateAllUserTokens(
    userId: number,
    platform?: 'web' | 'android' | 'ios'
  ): Observable<boolean> {
    return this.getDeviceTokensByUser(userId).pipe(
      map((tokens) => {
        const activeTokens = tokens.filter(
          (t) => t.isActive && (!platform || t.platform === platform)
        );
        if (activeTokens.length === 0) {
          return true;
        }

        activeTokens.forEach((token) => {
          this.updateDeviceToken(token.id!, { isActive: false }).subscribe({
            next: () => {},
            error: (error) => {
              console.error('Lỗi khi vô hiệu hóa token:', error);
            },
          });
        });

        return true;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Xử lý lỗi HTTP
   * @param error HttpErrorResponse
   * @returns Observable<never>
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error.error instanceof ErrorEvent) {
      // Lỗi client-side
      errorMessage = error.error.message;
    } else {
      // Lỗi server-side
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Mã lỗi: ${error.status}\nThông báo: ${error.message}`;
      }
    }

    console.error('DeviceTokenService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

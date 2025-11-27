import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Import User interface từ auth service
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
  deviceId?: string;
  note?: string;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string | null;
  createAt?: string;
  updateAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = environment.apiUrl + '/User';

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách người dùng theo phòng ban
   * API doc: GET /User/GetUsersByDepartment/{departmentId}
   */
  getUsersByDepartment(departmentId: number): Observable<User[]> {
    console.log('👥 [UserService] Getting users for department:', departmentId);

    if (!departmentId || departmentId <= 0) {
      const error = new Error('Invalid departmentId');
      console.error('❌ [UserService] Invalid departmentId:', departmentId);
      return throwError(() => error);
    }

    return this.http.get<User[]>(`${this.API_URL}/GetUsersByDepartment/${departmentId}`).pipe(
      tap((users) => {
        console.log(
          `✅ [UserService] Retrieved ${users.length} users from department ${departmentId}`
        );
        console.log(
          '👥 [UserService] Users:',
          users.map((u) => ({ id: u.id, name: u.name, email: u.email }))
        );
      }),
      catchError((error) => {
        console.error('❌ [UserService] Failed to get users by department:', error);
        console.error('❌ [UserService] Error details:', {
          status: error.status,
          message: error.error?.message || error.message,
          url: error.url,
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Lọc user có device token để gửi FCM notification
   */
  filterUsersWithDeviceTokens(users: User[]): User[] {
    const usersWithTokens = users.filter((user) => user.deviceId && user.deviceId.trim() !== '');
    console.log(
      `📱 [UserService] Filtered ${usersWithTokens.length}/${users.length} users with device tokens`
    );
    return usersWithTokens;
  }
}

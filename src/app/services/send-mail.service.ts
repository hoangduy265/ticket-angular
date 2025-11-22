import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interface cho thông tin user từ localStorage
interface LocalStorageUser {
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

// Interface cho request gửi email
export interface SendEmailRequest {
  toEmail: string;
  subject: string;
  message: string;
  isHtml?: boolean;
}

// Interface cho response
export interface SendEmailResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SendMailService {
  private readonly API_URL = environment.apiUrl + '/NotifySend';

  constructor(private http: HttpClient) {}

  /**
   * Gửi email thông báo
   */
  sendEmail(request: SendEmailRequest): Observable<SendEmailResponse> {
    // Set default isHtml to true if not provided
    const emailRequest = {
      ...request,
      isHtml: request.isHtml !== undefined ? request.isHtml : true,
    };

    return this.http
      .post<SendEmailResponse>(`${this.API_URL}/SendEmail`, emailRequest)
      .pipe(catchError(this.handleError));
  }

  /**
   * Gửi email liên hệ từ form contact
   */
  sendContactEmail(subject: string, message: string): Observable<SendEmailResponse> {
    const request: SendEmailRequest = {
      toEmail: 'duyhq@royalgroup.vn',
      subject: `Liên hệ từ website: ${subject}`,
      message: this.formatContactMessage(subject, message),
      isHtml: true,
    };

    return this.sendEmail(request);
  }

  /**
   * Format nội dung email liên hệ
   */
  private formatContactMessage(subject: string, message: string): string {
    const currentDate = new Date().toLocaleString('vi-VN');
    const user = this.getCurrentUser();

    // Thông tin người gửi
    const senderInfo = user
      ? `
      <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; color: #1976d2; font-size: 14px;">📋 Thông tin người gửi:</h4>
        <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 3px 8px; font-weight: bold; width: 100px;">Họ tên:</td>
            <td style="padding: 3px 8px;">${user.name || 'N/A'}</td>
          </tr>
          <tr style="background: rgba(255,255,255,0.5);">
            <td style="padding: 3px 8px; font-weight: bold;">Email:</td>
            <td style="padding: 3px 8px;">${user.email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 8px; font-weight: bold;">SĐT:</td>
            <td style="padding: 3px 8px;">${user.phone || 'N/A'}</td>
          </tr>
          <tr style="background: rgba(255,255,255,0.5);">
            <td style="padding: 3px 8px; font-weight: bold;">Phòng ban:</td>
            <td style="padding: 3px 8px;">${user.departmentName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 8px; font-weight: bold;">Công ty:</td>
            <td style="padding: 3px 8px;">${user.companyName || 'N/A'}</td>
          </tr>
        </table>
      </div>
    `
      : `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 15px 0;">
        <p style="margin: 0; color: #856404; font-size: 13px;">⚠️ <strong>Lưu ý:</strong> Không thể lấy thông tin người gửi từ hệ thống.</p>
      </div>
    `;

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              📧 Email liên hệ từ website
            </h2>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 16px;">📌 Chủ đề: ${subject}</h3>
              <div style="white-space: pre-line; background: white; padding: 12px; border-radius: 4px; border-left: 3px solid #2563eb;">
                ${message}
              </div>
            </div>

            ${senderInfo}

            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p style="margin: 5px 0;"><strong>Thời gian gửi:</strong> ${currentDate}</p>
              <p style="margin: 5px 0;"><strong>Nguồn:</strong> Hệ thống quản lý ticket</p>
              <p style="margin: 5px 0;"><strong>ID người gửi:</strong> ${user?.id || 'N/A'}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Lấy thông tin user từ localStorage
   */
  private getCurrentUser(): LocalStorageUser | null {
    try {
      const userJson = localStorage.getItem('current_user');
      if (userJson) {
        return JSON.parse(userJson);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  }

  /**
   * Xử lý lỗi HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Có lỗi xảy ra khi gửi email';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 400) {
        errorMessage = 'Dữ liệu đầu vào không hợp lệ';
      } else if (error.status === 500) {
        errorMessage = 'Lỗi hệ thống khi gửi email';
      }
    }

    console.error('SendEmail Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

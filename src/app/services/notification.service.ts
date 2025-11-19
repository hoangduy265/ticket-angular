import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { object } from '@angular/fire/database';

// Request/Response Interfaces
export interface SendEmailRequest {
  toEmail: string;
  subject: string;
  message: string;
  isHtml?: boolean;
}

export interface SendTelegramRequest {
  chatId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}

export interface SendFCMRequest {
  deviceToken: string;
  title: string;
  body: string;
  data?: { [key: string]: string };
}

// Response Interface
export interface NotificationResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly API_URL = environment.apiUrl + '/NotifySend';

  constructor(private http: HttpClient) {}

  /**
   * Gửi email thông báo
   * API doc: POST /NotifySend/SendEmail
   */
  sendEmail(request: SendEmailRequest): Observable<NotificationResponse> {
    console.log('📧 Sending email - Full request object:', request);
    console.log('📧 Request stringified:', JSON.stringify(request));

    // API expects direct object: { toEmail, subject, message, isHtml }
    return this.http.post<NotificationResponse>(`${this.API_URL}/SendEmail`, request);
  }

  /**
   * Gửi tin nhắn Telegram
   * API doc: POST /NotifySend/SendTelegram
   */
  sendTelegram(request: SendTelegramRequest): Observable<NotificationResponse> {
    console.log('📱 Sending Telegram message:', { chatId: request.chatId });

    return this.http.post<NotificationResponse>(`${this.API_URL}/SendTelegram`, request);
  }

  /**
   * Gửi thông báo FCM (Firebase Cloud Messaging)
   * API doc: POST /NotifySend/SendFCM
   */
  sendFCM(request: SendFCMRequest): Observable<NotificationResponse> {
    console.log('🔔 Sending FCM notification:', { title: request.title });

    return this.http.post<NotificationResponse>(`${this.API_URL}/SendFCM`, request);
  }

  /**
   * Helper: Gửi email thông báo ticket mới
   * @param object - SendEmailRequest với toEmail, subject, message
   */
  sendNewTicketEmail(object: SendEmailRequest): Observable<NotificationResponse> {
    console.log('📧 sendNewTicketEmail called with:', {
      toEmail: object.toEmail,
      subject: object.subject,
      messageLength: object.message?.length,
    });

    // Parse message để lấy thông tin
    const lines = object.message.split('\n\n');
    const creator = lines[0] || 'N/A';
    const description = lines[1] || 'Không có mô tả';

    // HTML đơn giản với bảng - dễ parse hơn cho email
    const htmlBody = `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">🎫 Thông báo Ticket mới</h1>
            <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0 0; opacity: 0.9;">Có ticket mới cần được xử lý</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            
            <!-- Ticket Info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-left: 4px solid #667eea; border-radius: 8px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 20px;">
                  <div style="background: #667eea; color: #ffffff; display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 18px; font-weight: 600;">TICKET: ${object.subject}</div>
                  <div style="color: #1e40af; font-size: 16px; font-weight: 600; margin-top: 10px;"></div>
                </td>
              </tr>
            </table>
            
            <!-- Creator -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 8px;">👤 NGƯỜI TẠO : ${creator}</div>
                  <div style="color: #1f2937; font-size: 14px; padding: 10px; background: #ffffff; border-left: 3px solid #667eea; border-radius: 4px;"></div>
                </td>
              </tr>
            </table>
            
            <!-- Divider -->
            <div style="height: 1px; background: #e5e7eb; margin: 20px 0;"></div>
            
            <!-- Description -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 8px;">📝 MÔ TẢ CHI TIẾT</div>
                  <div style="color: #1f2937; font-size: 14px; padding: 10px; background: #ffffff; border-left: 3px solid #667eea; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">${description}</div>
                </td>
              </tr>
            </table>
            
            <!-- Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  
                </td>
              </tr>
            </table>
            
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0;">📧 Email này được gửi tự động từ hệ thống Royal Ticket</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0; font-style: italic;">Vui lòng không trả lời email này</p>
          </td>
        </tr>
        
      </table>
    </td>
  </tr>
</table>
    `.trim();

    const request: SendEmailRequest = {
      toEmail: object.toEmail,
      subject: object.subject,
      message: htmlBody,
      isHtml: true,
    };

    console.log('📧 Sending beautiful HTML email notification');

    return this.sendEmail(request);
  }

  /**
   * Helper: Gửi email thông báo thay đổi trạng thái ticket
   */
  sendTicketStatusChangeEmail(
    toEmail: string,
    ticketId: number,
    oldStatus: string,
    newStatus: string
  ): Observable<NotificationResponse> {
    const request: SendEmailRequest = {
      toEmail: toEmail,
      subject: `[Ticket #${ticketId}] Trạng thái đã thay đổi`,
      message: `
        <h3>Thông báo thay đổi trạng thái</h3>
        <p>Ticket <strong>#${ticketId}</strong> đã thay đổi trạng thái.</p>
        <p><strong>Từ:</strong> ${oldStatus}</p>
        <p><strong>Sang:</strong> ${newStatus}</p>
        <p>Vui lòng đăng nhập hệ thống để xem chi tiết.</p>
      `,
      isHtml: true,
    };

    return this.sendEmail(request);
  }

  /**
   * Helper: Gửi Telegram thông báo ticket mới
   */
  sendNewTicketTelegram(
    chatId: string,
    ticketId: number,
    ticketTitle: string
  ): Observable<NotificationResponse> {
    const request: SendTelegramRequest = {
      chatId: chatId,
      message: `
🎫 <b>Ticket mới #${ticketId}</b>

📝 <b>Tiêu đề:</b> ${ticketTitle}

Vui lòng kiểm tra hệ thống để xem chi tiết.
      `,
      parseMode: 'HTML',
    };

    return this.sendTelegram(request);
  }

  /**
   * Helper: Gửi FCM thông báo ticket mới
   */
  sendNewTicketFCM(
    deviceToken: string,
    ticketId: number,
    ticketTitle: string
  ): Observable<NotificationResponse> {
    const request: SendFCMRequest = {
      deviceToken: deviceToken,
      title: 'Ticket mới',
      body: `#${ticketId}: ${ticketTitle}`,
      data: {
        ticketId: ticketId.toString(),
        type: 'new_ticket',
        priority: 'normal',
      },
    };

    return this.sendFCM(request);
  }

  /**
   * Helper: Gửi FCM thông báo thay đổi trạng thái
   */
  sendTicketStatusChangeFCM(
    deviceToken: string,
    ticketId: number,
    newStatus: string
  ): Observable<NotificationResponse> {
    const request: SendFCMRequest = {
      deviceToken: deviceToken,
      title: 'Cập nhật trạng thái Ticket',
      body: `Ticket #${ticketId} đã chuyển sang: ${newStatus}`,
      data: {
        ticketId: ticketId.toString(),
        type: 'status_change',
        status: newStatus,
      },
    };

    return this.sendFCM(request);
  }
}

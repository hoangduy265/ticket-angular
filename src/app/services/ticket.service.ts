import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';

//#region scopte_Interfaces
// Interfaces cho Ticket
export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: number;
  type?: number;
  note?: string;
  slaType?: string;
  createdBy: number;
  createdAt: string;
  closedAt?: string;
  processBy?: number;
  processByName?: string;
  rate?: number;
  rateAt?: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  status?: number;
  type?: number;
  note?: string;
  slaType?: string;
  isActive?: boolean;
  createdBy: number;
  closedAt?: string;
  assignedTo?: number;
  imagePath?: string;
  imageName?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  type?: number;
  note?: string;
  slaType?: string;
  isActive?: boolean;
  assignedTo?: number;
  rate?: number;
}

export interface ChangeStatusRequest {
  status: number;
}

export interface RateTicketRequest {
  rate: number;
}

export interface TicketFilterRequest {
  status?: number;
  createdBy?: number;
  processBy?: number;
  rate?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  message: string;
}

export interface UploadImageResponse {
  message: string;
  uploadedFile: {
    fileName: string;
    filePath: string;
    fileSize: number;
  };
}

export interface TicketImage {
  id: number;
  ticketId: number;
  imageUrl: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly API_URL = environment.apiUrl + '/Ticket';

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  /**
   * Tạo ticket mới
   * Sau khi tạo thành công, gửi thông báo qua Telegram
   */
  createTicket(ticket: CreateTicketRequest): Observable<{ code: number; message: string }> {
    return this.http
      .post<{ code: number; message: string }>(`${this.API_URL}/CreateTicket`, ticket)
      .pipe(
        tap((response) => {
          // Nếu tạo ticket thành công, gửi thông báo Telegram
          if (response.code === 200) {
            console.log('✅ Ticket created successfully, sending Telegram notification...');
            this.notificationService
              .sendTelegram({
                chatId: environment.telegramBot.chatId,
                message: `📩 <b>Ticket mới được tạo</b>\n\n📝 ${ticket.title}\n\n👤 Người tạo: ID ${ticket.createdBy}`,
                parseMode: 'HTML',
              })
              .subscribe({
                next: (res) => {
                  console.log('✅ Telegram notification sent:', res.message);
                },
                error: (err) => {
                  console.error('❌ Failed to send Telegram notification:', err);
                  // Không throw error để không ảnh hưởng đến việc tạo ticket
                },
              });
          }
        })
      );
  }

  /**
   * Cập nhật ticket
   */
  updateTicket(id: number, ticket: UpdateTicketRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/UpdateTicket/${id}`, ticket);
  }

  /**   * Thay đổi trạng thái ticket   **/
  changeTicketStatus(id: number, status: number): Observable<{ message: string }> {
    const request: ChangeStatusRequest = { status };
    return this.http.put<{ message: string }>(`${this.API_URL}/ChangeStatus/${id}`, request);
  }

  /** Đánh giá ticket **/
  rateTicket(id: number, rate: number): Observable<{ message: string }> {
    const request: RateTicketRequest = { rate };
    return this.http.put<{ message: string }>(`${this.API_URL}/RateTicket/${id}`, request);
  }

  /** Lấy danh sách tickets có phân trang và bộ lọcLấy danh sách tickets có phân trang và bộ lọc
   * pageSize max = 100 theo API doc  */
  getTicketsList(
    page: number = 1,
    pageSize: number = 50,
    filters?: TicketFilterRequest
  ): Observable<PaginatedResponse<Ticket>> {
    // Đảm bảo pageSize không vượt quá giới hạn API
    const safePageSize = Math.min(pageSize, 100);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', safePageSize.toString());

    if (filters) {
      if (filters.status !== undefined) {
        params = params.set('status', filters.status.toString());
      }
      if (filters.createdBy !== undefined) {
        params = params.set('createdBy', filters.createdBy.toString());
      }
      if (filters.processBy !== undefined) {
        params = params.set('processBy', filters.processBy.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.isActive !== undefined) {
        params = params.set('isActive', filters.isActive.toString());
      }
    }
    return this.http.get<PaginatedResponse<Ticket>>(`${this.API_URL}/GetList`, { params });
  }

  /** Lấy ticket theo ID **/
  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.API_URL}/GetById/${id}`);
  }

  /** Health check **/
  healthCheck(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(`${this.API_URL}/HealthCheck`);
  }

  /**Upload hình ảnh cho ticket **/
  uploadImage(file: File, userId: number): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());

    return this.http.post<UploadImageResponse>(`${this.API_URL}/UploadImage`, formData);
  }

  /** Upload hình ảnh cho ticket (gắn vào ticket cụ thể)
   * API doc: POST /Ticket/UploadImageTicket?userId=X&ticketId=Y (form-data: file) **/
  uploadImageToTicket(
    file: File,
    userId: number,
    ticketId: number
  ): Observable<UploadImageResponse> {
    console.log('📤 uploadImageToTicket called with:', {
      fileName: file.name,
      fileSize: file.size,
      userId,
      ticketId,
      ticketIdType: typeof ticketId,
    });

    // Validate inputs
    if (!file || !userId || !ticketId || ticketId <= 0) {
      const error = new Error('Invalid parameters for uploadImageToTicket');
      console.error('❌ Validation failed:', { file: !!file, userId, ticketId });
      return throwError(() => error);
    }

    // Prepare FormData - chỉ chứa file
    const formData = new FormData();
    formData.append('file', file, file.name);

    // userId và ticketId được gửi qua query params
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('ticketId', ticketId.toString());

    console.log('📦 Request details:', {
      file: file.name,
      queryParams: { userId, ticketId },
      url: `${this.API_URL}/UploadImageTicket?userId=${userId}&ticketId=${ticketId}`,
    });

    // Upload to API with query params
    return this.http
      .post<UploadImageResponse>(`${this.API_URL}/UploadImageTicket`, formData, { params })
      .pipe(
        tap((response) => {
          console.log('✅ Upload successful:', response);
        }),
        catchError((error) => {
          console.error('❌ Upload failed:', error);
          console.error('❌ Error details:', {
            status: error.status,
            message: error.error?.message || error.message,
            url: error.url,
          });
          return throwError(() => error);
        })
      );
  }

  /* Lấy danh sách hình ảnh của ticket * API doc: GET /Ticket/{ticketId}/Images*/
  getTicketImages(ticketId: number): Observable<TicketImage[]> {
    if (!ticketId || ticketId <= 0) {
      const error = new Error('Invalid ticketId');
      console.error('❌ Invalid ticketId:', ticketId);
      return throwError(() => error);
    }

    return this.http.get<TicketImage[]>(`${this.API_URL}/${ticketId}/Images`).pipe(
      tap((images) => {}),
      catchError((error) => {
        console.error('❌ Failed to load ticket images:', error);
        return throwError(() => error);
      })
    );
  }

  /** Tạo ticket và trả về ID (CreateTicketReturnId) **/
  createTicketReturnId(ticket: CreateTicketRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.API_URL}/CreateTicketReturnId`, ticket).pipe(
      tap((response) => {
        // Nếu tạo ticket thành công, gửi thông báo Telegram
        if (response.id != 0) {
          // Gửi thông báo Telegram
          this.notificationService
            .sendTelegram({
              chatId: environment.telegramBot.chatId,
              message: `📩 Ticket mới được tạo\n\n 📝 Tiêu đề: ${
                ticket.title
              }\n\n 👤 Người tạo: ${localStorage.getItem('Name')}`,
              parseMode: 'HTML',
            })
            .subscribe({
              next: (res) => {
                console.log('✅ Telegram notification sent:', res.message);
              },
              error: (err) => {
                console.error('❌ Failed to send Telegram notification:', err);
                // Không throw error để không ảnh hưởng đến việc tạo ticket
              },
            });
          // Gửi thông báo qua Email
          var requets = {
            toEmail: environment.EmailBot.email,
            subject: `Ticket #${response.id} - ${ticket.title}`,
            message: `Người tạo: ${localStorage.getItem('Name')}\n\n${ticket.description}`,
          };
          this.notificationService.sendNewTicketEmail(requets).subscribe({
            next: (res) => {
              console.log('✅ Email notification sent:', res.message);
            },
            error: (err) => {
              debugger;
              console.error('❌ Failed to send Email notification:', err);
              // Không throw error để không ảnh hưởng đến việc tạo ticket
            },
          });
        }
      })
    );
  }

  ngOnDestroy(): void {}
}
